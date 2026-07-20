import { getCurrentCompanyId } from "@/lib/company";
import {
    evaluateRequiredDocuments,
    getRequiredDocumentsForSale,
} from "@/lib/sales/sale-required-documents";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";
import { getSaleTaxConfiguration } from "@/utils/sale-tax-rules";

export type SaleType = "inland" | "eu" | "export_third_country";
export type SaleStatus = "draft" | "active" | "completed" | "cancelled";
export type PaymentStatus = "open" | "partial" | "paid";
export type DocumentCheckStatus = "complete" | "missing" | "warning";
export type DatevStatus = "not_sent" | "sent";

export type SaleRow = {
    id: string;
    vehicle_id: string;
    buyer_customer_id: string;
    sale_date: string;
    sale_type: SaleType;
    net_amount: number;
    vat_rate: number;
    vat_amount: number;
    gross_amount: number;
    status: SaleStatus;
    payment_status: PaymentStatus;
    document_check_status: DocumentCheckStatus;
    datev_status: DatevStatus;
    notes: string | null;
    created_at: string;

    invoice_id: string | null;
    invoice_number: string | null;
    has_proforma_invoice: boolean;

    vehicle_internal_number: string;
    vehicle_name: string;
    vin: string;
    purchase_price_net: number;
    additional_costs_net: number;

    customer_name: string;
    customer_country: string;

    required_documents_count: number;
    available_required_documents_count: number;
    missing_required_documents_count: number;
    missing_required_document_labels: string[];
};

type InvoiceRelation = {
    id: string;
    invoice_number: string;
    invoice_type: InvoiceType | null;
};

type DocumentRelation = {
    document_type: string;
    status: "available" | "missing" | "needs_review";
};

type SupabaseRelation<T> = T | T[] | null;

type SaleQueryRow = {
    id: string;
    vehicle_id: string;
    buyer_customer_id: string;
    sale_date: string;
    sale_type: SaleType | null;
    net_amount: number | string;
    vat_rate: number | string;
    vat_amount: number | string;
    gross_amount: number | string;
    status: SaleStatus;
    payment_status: PaymentStatus;
    document_check_status: DocumentCheckStatus;
    datev_status: DatevStatus;
    notes: string | null;
    created_at: string;

    vehicles: {
        internal_number: string;
        manufacturer: string;
        model: string;
        vin: string;
        purchase_price_net: number | string;
        additional_costs_net: number | string;
    } | null;

    customers: {
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
        country: string;
        tax_number: string | null;
        vat_id: string | null;
    } | null;

    invoices: SupabaseRelation<InvoiceRelation>;
    documents: SupabaseRelation<DocumentRelation>;
};

function getSingleRelation<T>(relation: SupabaseRelation<T>): T | null {
    if (!relation) return null;

    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation;
}

function getManyRelation<T>(relation: SupabaseRelation<T>): T[] {
    if (!relation) return [];

    if (Array.isArray(relation)) {
        return relation;
    }

    return [relation];
}

function getCustomerName(customer: SaleQueryRow["customers"]): string {
    if (!customer) return "Unbekannter Kunde";

    if (customer.type === "company") {
        return customer.company_name ?? "Unbekannte Firma";
    }

    const privateName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    return privateName.length > 0 ? privateName : "Unbekannte Privatperson";
}

export async function getSales(): Promise<SaleRow[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("sales")
        .select(
            `
      id,
      vehicle_id,
      buyer_customer_id,
      sale_date,
      sale_type,
      net_amount,
      vat_rate,
      vat_amount,
      gross_amount,
      status,
      payment_status,
      document_check_status,
      datev_status,
      notes,
      created_at,
      vehicles (
        internal_number,
        manufacturer,
        model,
        vin,
        purchase_price_net,
        additional_costs_net
      ),
      customers:buyer_customer_id (
        type,
        company_name,
        first_name,
        last_name,
        country,
        tax_number,
        vat_id
      ),
      invoices (
        id,
        invoice_number,
        invoice_type
      ),
      documents (
        document_type,
        status
      )
    `,
        )
        .eq("company_id", companyId)
        .order("sale_date", { ascending: false });

    if (error) {
        throw new Error(`Verkäufe konnten nicht geladen werden: ${error.message}`);
    }

    return ((data ?? []) as unknown as SaleQueryRow[]).map((sale) => {
        const vehicle = sale.vehicles;
        const customer = sale.customers;
        const invoice = getSingleRelation(sale.invoices);
        const invoices = getManyRelation(sale.invoices);
        const saleType = sale.sale_type ?? "inland";

        const relatedDocuments = getManyRelation(sale.documents);

        const requiredDocuments = getRequiredDocumentsForSale({
            saleType,
            isCompanyCustomer: customer?.type === "company",
        });

        const documentCheck = evaluateRequiredDocuments({
            requiredDocuments,
            documents: relatedDocuments,
        });
        const taxConfiguration = getSaleTaxConfiguration({
            buyerType: customer?.type,
            deliveryType: saleType,
            billingCountry: customer?.country,
        });
        const missingRequiredDataLabels = [
            taxConfiguration.showTaxNumber && !customer?.tax_number
                ? "Steuernummer beim Kunden fehlt."
                : null,
            taxConfiguration.showVatId && !customer?.vat_id
                ? "USt-IdNr. beim Kunden fehlt."
                : null,
        ].filter((label): label is string => Boolean(label));
        const isDocumentCheckComplete =
            documentCheck.isComplete && missingRequiredDataLabels.length === 0;

        return {
            id: sale.id,
            vehicle_id: sale.vehicle_id,
            buyer_customer_id: sale.buyer_customer_id,
            sale_date: sale.sale_date,
            sale_type: saleType,
            net_amount: Number(sale.net_amount),
            vat_rate: Number(sale.vat_rate),
            vat_amount: Number(sale.vat_amount),
            gross_amount: Number(sale.gross_amount),
            status: sale.status,
            payment_status: sale.payment_status,
            document_check_status: isDocumentCheckComplete ? "complete" : "missing",
            datev_status: sale.datev_status,
            notes: sale.notes,
            created_at: sale.created_at,

            invoice_id: invoice?.id ?? null,
            invoice_number: invoice?.invoice_number ?? null,
            has_proforma_invoice: invoices.some((item) => item.invoice_type === "proforma"),

            vehicle_internal_number: vehicle?.internal_number ?? "—",
            vehicle_name: vehicle
                ? `${vehicle.manufacturer} ${vehicle.model}`
                : "Unbekanntes Fahrzeug",
            vin: vehicle?.vin ?? "—",
            purchase_price_net: Number(vehicle?.purchase_price_net ?? 0),
            additional_costs_net: Number(vehicle?.additional_costs_net ?? 0),

            customer_name: getCustomerName(customer),
            customer_country: customer?.country ?? "—",

            required_documents_count: documentCheck.requiredCount,
            available_required_documents_count: documentCheck.availableCount,
            missing_required_documents_count: documentCheck.missingCount,
            missing_required_document_labels: [
                ...documentCheck.missingLabels,
                ...missingRequiredDataLabels,
            ],
        };
    });
}
