import { getCurrentCompanyId } from "@/lib/company";
import type { InvoicePdfData } from "@/lib/pdf/invoice-pdf";
import { getCompanySignatureStampAssets } from "@/lib/pdf/company-signature-assets";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";
import type { SaleType } from "@/lib/sales/sale-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CompanyRelation = {
    legal_name: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    email: string | null;
    phone: string | null;
    vat_id: string | null;
    tax_number: string | null;
    commercial_register_number: string | null;
};

type CustomerRelation = {
    type: "company" | "private";
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    street: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    vat_id: string | null;
    preferred_language: string | null;
};

type VehicleRelation = {
    internal_number: string;
    manufacturer: string;
    model: string;
    vehicle_type: string;
    vin: string;
    first_registration: string | null;
    construction_year: number | null;
    damage_notes: string | null;
};

type SaleRelation = {
    sale_type: SaleType | null;
    invoice_notes: string | null;
    include_damage_notes_on_invoice: boolean | null;
};

type SupabaseRelation<T> = T | T[] | null;

type InvoiceQueryResult = {
    id: string;
    invoice_type: InvoiceType | null;
    invoice_number: string;
    invoice_date: string;
    net_amount: number | string;
    vat_rate: number | string;
    vat_amount: number | string;
    gross_amount: number | string;
    include_signature_stamp: boolean | null;
    companies: SupabaseRelation<CompanyRelation>;
    customers: SupabaseRelation<CustomerRelation>;
    vehicles: SupabaseRelation<VehicleRelation>;
    sales: SupabaseRelation<SaleRelation>;
};

function getSingleRelation<T>(relation: SupabaseRelation<T>): T | null {
    if (!relation) return null;

    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation;
}

function getCustomerName(customer: CustomerRelation | null): string {
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

function getSaleTypeValue(sale: SaleRelation | null): SaleType {
    if (
        sale?.sale_type === "inland" ||
        sale?.sale_type === "eu" ||
        sale?.sale_type === "export_third_country"
    ) {
        return sale.sale_type;
    }

    return "inland";
}

export async function getInvoicePdfData(
    invoiceId: string,
): Promise<InvoicePdfData> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("invoices")
        .select(
            `
      id,
      invoice_type,
      invoice_number,
      invoice_date,
      net_amount,
      vat_rate,
      vat_amount,
      gross_amount,
      include_signature_stamp,
      companies (
        legal_name,
        street,
        postal_code,
        city,
        country,
        email,
        phone,
        vat_id,
        tax_number,
        commercial_register_number
      ),
      customers (
        type,
        company_name,
        first_name,
        last_name,
        street,
        postal_code,
        city,
        country,
        vat_id,
        preferred_language
      ),
      vehicles (
        internal_number,
        manufacturer,
        model,
        vehicle_type,
        vin,
        first_registration,
        construction_year,
        damage_notes
      ),
      sales (
        sale_type,
        invoice_notes,
        include_damage_notes_on_invoice
      )
    `,
        )
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) {
        throw new Error(
            `Rechnung konnte nicht geladen werden: ${
                error?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const invoice = data as unknown as InvoiceQueryResult;

    const company = getSingleRelation(invoice.companies);
    const customer = getSingleRelation(invoice.customers);
    const vehicle = getSingleRelation(invoice.vehicles);
    const sale = getSingleRelation(invoice.sales);

    if (!company || !customer || !vehicle) {
        throw new Error(
            "Rechnung ist unvollständig. Firma, Kunde oder Fahrzeug fehlt.",
        );
    }

    return {
        invoiceType: invoice.invoice_type ?? "standard",
        saleType: getSaleTypeValue(sale),
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        signatureStamp: {
            include: Boolean(invoice.include_signature_stamp),
            ...(await getCompanySignatureStampAssets(
                Boolean(invoice.include_signature_stamp),
            )),
        },
        company: {
            legalName: company.legal_name,
            street: company.street,
            postalCode: company.postal_code,
            city: company.city,
            country: company.country,
            email: company.email,
            phone: company.phone,
            vatId: company.vat_id,
            taxNumber: company.tax_number,
            registrationId: company.commercial_register_number,
        },
        customer: {
            name: getCustomerName(customer),
            street: customer.street,
            postalCode: customer.postal_code,
            city: customer.city,
            country: customer.country,
            vatId: customer.vat_id,
            preferredLanguage: customer.preferred_language,
        },
        vehicle: {
            internalNumber: vehicle.internal_number,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            vehicleType: vehicle.vehicle_type,
            vin: vehicle.vin,
            firstRegistration: vehicle.first_registration,
            constructionYear: vehicle.construction_year,
            damageNotes: vehicle.damage_notes,
        },
        includeDamageNotesOnInvoice: Boolean(
            sale?.include_damage_notes_on_invoice,
        ),
        invoiceNotes: sale?.invoice_notes ?? null,
        amounts: {
            netAmount: Number(invoice.net_amount),
            vatRate: Number(invoice.vat_rate),
            vatAmount: Number(invoice.vat_amount),
            grossAmount: Number(invoice.gross_amount),
        },
    };
}
