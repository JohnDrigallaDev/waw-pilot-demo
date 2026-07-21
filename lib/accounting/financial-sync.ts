import { createServerSupabaseClient } from "@/lib/supabase/server";

type FinancialSourceType = "sale_payment" | "purchase_payment" | "cashbook_entry";

type FinancialEntryPayload = {
    source_type: FinancialSourceType;
    source_id: string;
    source_reference: string;
    entry_type: string;
    payment_method: "cash" | "bank" | null;
    booking_date: string;
    document_date: string | null;
    amount: number;
    direction: "in" | "out";
    description: string;
    category_code: string;
    customer_id: string | null;
    vehicle_id: string | null;
    sale_id: string | null;
    purchase_id: string | null;
    invoice_id: string | null;
    document_id: string | null;
    status: "active" | "voided" | "sync_error";
    is_cash_relevant: boolean;
    voided_at?: string | null;
    voided_by?: string | null;
    void_reason?: string | null;
};

async function getCategoryId(companyId: string, categoryCode: string): Promise<string | null> {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
        .from("financial_categories")
        .select("id")
        .or(`company_id.eq.${companyId},company_id.is.null`)
        .eq("code", categoryCode)
        .order("company_id", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    return (data?.id as string | undefined) ?? null;
}

async function createFinancialReference(companyId: string): Promise<string> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("next_financial_entry_reference", {
        target_company_id: companyId,
    });

    if (error || typeof data !== "string") {
        throw new Error("Finanzreferenz konnte nicht erzeugt werden.");
    }

    return data;
}

async function upsertFinancialEntry(companyId: string, payload: FinancialEntryPayload) {
    const supabase = createServerSupabaseClient();
    const categoryId = await getCategoryId(companyId, payload.category_code);
    const { data: existingEntry } = await supabase
        .from("financial_entries")
        .select("id")
        .eq("company_id", companyId)
        .eq("source_type", payload.source_type)
        .eq("source_id", payload.source_id)
        .eq("entry_type", payload.entry_type)
        .maybeSingle();

    const values = {
        ...payload,
        category_id: categoryId,
        accounting_status: "UNREVIEWED",
        is_datev_relevant: true,
        updated_at: new Date().toISOString(),
    };

    if (existingEntry?.id) {
        const { error } = await supabase
            .from("financial_entries")
            .update(values)
            .eq("company_id", companyId)
            .eq("id", existingEntry.id);

        if (error) {
            throw new Error("Finanzjournal konnte nicht aktualisiert werden.");
        }

        return existingEntry.id as string;
    }

    const entryReference = await createFinancialReference(companyId);
    const { data, error } = await supabase
        .from("financial_entries")
        .insert({
            company_id: companyId,
            entry_reference: entryReference,
            ...values,
        })
        .select("id")
        .single();

    if (error || !data) {
        throw new Error("Finanzjournal konnte nicht angelegt werden.");
    }

    return data.id as string;
}

export async function syncSalePaymentFinancialEntry({
    companyId,
    paymentId,
}: {
    companyId: string;
    paymentId: string;
}) {
    const supabase = createServerSupabaseClient();
    const { data: payment, error: paymentError } = await supabase
        .from("sale_payments")
        .select(
            "id, sale_id, payment_reference, amount, payment_method, payment_date, is_voided, voided_at, voided_by, void_reason",
        )
        .eq("company_id", companyId)
        .eq("id", paymentId)
        .single();

    if (paymentError || !payment) {
        throw new Error("Zahlung konnte nicht für das Finanzjournal geladen werden.");
    }

    const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select("id, buyer_customer_id, vehicle_id")
        .eq("company_id", companyId)
        .eq("id", payment.sale_id)
        .single();

    if (saleError || !sale) {
        throw new Error("Verkauf zur Zahlung konnte nicht geladen werden.");
    }

    const { data: invoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("company_id", companyId)
        .eq("sale_id", payment.sale_id)
        .neq("invoice_type", "proforma")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const isVoided = Boolean(payment.is_voided);

    return upsertFinancialEntry(companyId, {
        source_type: "sale_payment",
        source_id: payment.id as string,
        source_reference: payment.payment_reference as string,
        entry_type: "sale_payment",
        payment_method: payment.payment_method as "cash" | "bank",
        booking_date: payment.payment_date as string,
        document_date: payment.payment_date as string,
        amount: Number(payment.amount),
        direction: "in",
        description: `Zahlung ${payment.payment_reference} aus Verkauf`,
        category_code: "vehicle_sale",
        customer_id: (sale.buyer_customer_id as string | null) ?? null,
        vehicle_id: (sale.vehicle_id as string | null) ?? null,
        sale_id: payment.sale_id as string,
        purchase_id: null,
        invoice_id: (invoice?.id as string | undefined) ?? null,
        document_id: null,
        status: isVoided ? "voided" : "active",
        is_cash_relevant: payment.payment_method === "cash" && !isVoided,
        voided_at: (payment.voided_at as string | null) ?? null,
        voided_by: (payment.voided_by as string | null) ?? null,
        void_reason: (payment.void_reason as string | null) ?? null,
    });
}

export async function syncPurchasePaymentFinancialEntry({
    companyId,
    paymentId,
}: {
    companyId: string;
    paymentId: string;
}) {
    const supabase = createServerSupabaseClient();
    const { data: payment, error: paymentError } = await supabase
        .from("purchase_payments")
        .select(
            "id, purchase_id, payment_reference, amount, payment_method, payment_date, is_voided, voided_at, voided_by, void_reason",
        )
        .eq("company_id", companyId)
        .eq("id", paymentId)
        .single();

    if (paymentError || !payment) {
        throw new Error("Ankaufzahlung konnte nicht für das Finanzjournal geladen werden.");
    }

    const { data: purchase, error: purchaseError } = await supabase
        .from("purchase_cases")
        .select("id, vehicle_id, seller_customer_id, purchase_number")
        .eq("company_id", companyId)
        .eq("id", payment.purchase_id)
        .single();

    if (purchaseError || !purchase) {
        throw new Error("Ankauf zur Zahlung konnte nicht geladen werden.");
    }

    const { data: document } = await supabase
        .from("documents")
        .select("id")
        .eq("company_id", companyId)
        .eq("purchase_case_id", payment.purchase_id)
        .eq("document_type", "purchase_invoice")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const isVoided = Boolean(payment.is_voided);

    return upsertFinancialEntry(companyId, {
        source_type: "purchase_payment",
        source_id: payment.id as string,
        source_reference: payment.payment_reference as string,
        entry_type: "purchase_payment",
        payment_method: payment.payment_method as "cash" | "bank",
        booking_date: payment.payment_date as string,
        document_date: payment.payment_date as string,
        amount: Number(payment.amount),
        direction: "out",
        description: `Zahlung Ankauf ${purchase.purchase_number ?? payment.purchase_id}`,
        category_code: "vehicle_purchase",
        customer_id: (purchase.seller_customer_id as string | null) ?? null,
        vehicle_id: (purchase.vehicle_id as string | null) ?? null,
        sale_id: null,
        purchase_id: payment.purchase_id as string,
        invoice_id: null,
        document_id: (document?.id as string | undefined) ?? null,
        status: isVoided ? "voided" : "active",
        is_cash_relevant: payment.payment_method === "cash" && !isVoided,
        voided_at: (payment.voided_at as string | null) ?? null,
        voided_by: (payment.voided_by as string | null) ?? null,
        void_reason: (payment.void_reason as string | null) ?? null,
    });
}

export async function syncCashbookEntryFinancialEntry({
    companyId,
    cashbookEntryId,
}: {
    companyId: string;
    cashbookEntryId: string;
}) {
    const supabase = createServerSupabaseClient();
    const { data: entry, error } = await supabase
        .from("cashbook_entries")
        .select(
            "id, entry_type, category, payment_method, amount, booking_date, description, customer_id, vehicle_id, sale_id, invoice_id, document_id, purchase_case_id",
        )
        .eq("company_id", companyId)
        .eq("id", cashbookEntryId)
        .single();

    if (error || !entry) {
        throw new Error("Kassenbuchbuchung konnte nicht für das Finanzjournal geladen werden.");
    }

    const direction = entry.entry_type === "income" ? "in" : "out";
    const knownCategoryCodes = new Set([
        "vehicle_purchase",
        "vehicle_sale",
        "other_income",
        "refund",
        "owner_deposit",
        "owner_withdrawal",
        "repair",
        "parts",
        "transport",
        "fuel",
        "toll",
        "insurance",
        "registration",
        "office",
        "tax_advice",
        "bank_fees",
        "other_expense",
        "other",
    ]);
    const category = entry.category as string;
    const normalizedCategory = knownCategoryCodes.has(category)
        ? category
        : entry.entry_type === "income"
          ? "other_income"
          : "other_expense";

    return upsertFinancialEntry(companyId, {
        source_type: "cashbook_entry",
        source_id: entry.id as string,
        source_reference: entry.id as string,
        entry_type: entry.entry_type === "income" ? "manual_income" : "manual_expense",
        payment_method: entry.payment_method as "cash" | "bank",
        booking_date: entry.booking_date as string,
        document_date: entry.booking_date as string,
        amount: Number(entry.amount),
        direction,
        description: entry.description as string,
        category_code: normalizedCategory,
        customer_id: (entry.customer_id as string | null) ?? null,
        vehicle_id: (entry.vehicle_id as string | null) ?? null,
        sale_id: (entry.sale_id as string | null) ?? null,
        purchase_id: (entry.purchase_case_id as string | null) ?? null,
        invoice_id: (entry.invoice_id as string | null) ?? null,
        document_id: (entry.document_id as string | null) ?? null,
        status: "active",
        is_cash_relevant: entry.payment_method === "cash",
    });
}
