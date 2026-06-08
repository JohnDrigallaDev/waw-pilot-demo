import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";

export type DocumentSource = "generated" | "uploaded";
export type DocumentStatus = "available" | "missing" | "needs_review";

export type DocumentRow = {
    id: string;
    document_type: string;
    source: DocumentSource;
    status: DocumentStatus;

    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;

    customer_id: string | null;
    vehicle_id: string | null;
    sale_id: string | null;
    invoice_id: string | null;

    generated_by_system: boolean;
    created_at: string;

    customer_name: string | null;
    vehicle_internal_number: string | null;
    vehicle_name: string | null;
    invoice_number: string | null;
};

type DocumentQueryRow = {
    id: string;
    document_type: string;
    source: DocumentSource;
    status: DocumentStatus;
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    customer_id: string | null;
    vehicle_id: string | null;
    sale_id: string | null;
    invoice_id: string | null;
    generated_by_system: boolean;
    created_at: string;
    customers: {
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
    } | null;
    vehicles: {
        internal_number: string;
        manufacturer: string;
        model: string;
    } | null;
    invoices: {
        invoice_number: string;
    } | null;
};

export async function getDocuments(): Promise<DocumentRow[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("documents")
        .select(
            `
      id,
      document_type,
      source,
      status,
      file_name,
      file_path,
      mime_type,
      file_size,
      customer_id,
      vehicle_id,
      sale_id,
      invoice_id,
      generated_by_system,
      created_at,
      customers (
        type,
        company_name,
        first_name,
        last_name
      ),
      vehicles (
        internal_number,
        manufacturer,
        model
      ),
      invoices!documents_invoice_id_fkey (
        invoice_number
      )
    `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Dokumente konnten nicht geladen werden: ${error.message}`);
    }

    return ((data ?? []) as DocumentQueryRow[]).map((document) => {
        const customer = document.customers;
        const vehicle = document.vehicles;
        const invoice = document.invoices;

        const customerName =
            customer?.type === "company"
                ? customer.company_name ?? "Unbekannte Firma"
                : [customer?.first_name, customer?.last_name].filter(Boolean).join(" ");

        return {
            id: document.id,
            document_type: document.document_type,
            source: document.source,
            status: document.status,

            file_name: document.file_name,
            file_path: document.file_path,
            mime_type: document.mime_type,
            file_size: document.file_size,

            customer_id: document.customer_id,
            vehicle_id: document.vehicle_id,
            sale_id: document.sale_id,
            invoice_id: document.invoice_id,

            generated_by_system: document.generated_by_system,
            created_at: document.created_at,

            customer_name: customerName || null,
            vehicle_internal_number: vehicle?.internal_number ?? null,
            vehicle_name: vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null,
            invoice_number: invoice?.invoice_number ?? null,
        };
    });
}