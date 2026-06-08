import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InvoiceType = "standard" | "proforma" | "down_payment";

type GetNextInvoiceNumberParams = {
    invoiceType?: InvoiceType;
    invoiceDate?: string;
};

export function getInvoiceTypeLabel(invoiceType: InvoiceType): string {
    const labels: Record<InvoiceType, string> = {
        standard: "Rechnung",
        proforma: "Proforma-Rechnung",
        down_payment: "Anzahlungsrechnung",
    };

    return labels[invoiceType];
}

export function getInvoiceTypeDocumentType(invoiceType: InvoiceType): string {
    const documentTypes: Record<InvoiceType, string> = {
        standard: "invoice_pdf",
        proforma: "proforma_invoice",
        down_payment: "down_payment_invoice",
    };

    return documentTypes[invoiceType];
}

export async function getNextInvoiceNumber({
                                               invoiceType = "standard",
                                               invoiceDate,
                                           }: GetNextInvoiceNumberParams = {}): Promise<string> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase.rpc("get_next_invoice_number", {
        p_company_id: companyId,
        p_invoice_type: invoiceType,
        p_invoice_date: invoiceDate ?? new Date().toISOString().slice(0, 10),
    });

    if (error || !data) {
        throw new Error(
            `Rechnungsnummer konnte nicht erzeugt werden: ${
                error?.message ?? "Keine Nummer erhalten"
            }`,
        );
    }

    return String(data);
}