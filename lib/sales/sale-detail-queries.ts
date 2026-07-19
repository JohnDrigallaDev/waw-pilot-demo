import { notFound } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import {
    getRequiredDocumentsForSale,
    type RequiredDocumentDefinition,
} from "@/lib/sales/sale-required-documents";
import type {
    DatevStatus,
    PaymentStatus,
    SaleStatus,
    SaleType,
} from "@/lib/sales/sale-queries";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseRelation<T> = T | T[] | null;

type InvoiceRelation = {
    id: string;
    invoice_type: InvoiceType;
    invoice_number: string;
    invoice_date: string;
    net_amount: number | string;
    vat_amount: number | string;
    gross_amount: number | string;
    payment_status: PaymentStatus;
    include_signature_stamp: boolean | null;
    pdf_document_id: string | null;
    email_sent_at: string | null;
    email_sent_to: string | null;
    email_sent_language: string | null;
    email_send_count: number | null;
    zugferd_file_path: string | null;
    zugferd_generated_at: string | null;
    zugferd_profile: string | null;
    zugferd_standard_version: string | null;
    zugferd_validation_status: "valid" | "invalid" | "pending" | null;
    zugferd_validated_at: string | null;
    zugferd_validation_summary: Record<string, unknown> | null;
    zugferd_sha256: string | null;
    zugferd_email_sent_at: string | null;
    zugferd_email_sent_to: string | null;
    zugferd_email_sent_language: string | null;
    zugferd_email_send_count: number | null;
    created_at: string;
};

type DocumentRelation = {
    id: string;
    document_type: string;
    source: string;
    status: "available" | "missing" | "needs_review";
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    created_at: string;
};

type SaleDetailQueryRow = {
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
    datev_status: DatevStatus;
    notes: string | null;
    invoice_notes: string | null;
    include_damage_notes_on_invoice: boolean | null;
    created_at: string;

    companies: {
        signature_image_path: string | null;
        stamp_image_path: string | null;
    } | null;

    vehicles: {
        internal_number: string;
        manufacturer: string;
        model: string;
        vehicle_type: string;
        vin: string;
        license_plate: string | null;
        construction_year: number | null;
        first_registration: string | null;
        purchase_price_net: number | string;
        sale_price_net: number | string | null;
        additional_costs_net: number | string;
        damage_notes: string | null;
    } | null;

    customers: {
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
        street: string | null;
        postal_code: string | null;
        city: string | null;
        country: string | null;
        email: string | null;
        preferred_language: string;
        phone: string | null;
        tax_number: string | null;
        vat_id: string | null;
    } | null;

    invoices: SupabaseRelation<InvoiceRelation>;
    documents: SupabaseRelation<DocumentRelation>;
};

export type SaleDetailDocument = {
    id: string;
    document_type: string;
    source: string;
    status: "available" | "missing" | "needs_review";
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    created_at: string;
};

export type SaleDetailInvoice = {
    id: string;
    invoice_type: InvoiceType;
    invoice_number: string;
    invoice_date: string;
    net_amount: number;
    vat_amount: number;
    gross_amount: number;
    payment_status: PaymentStatus;
    include_signature_stamp: boolean;
    pdf_document_id: string | null;
    email_sent_at: string | null;
    email_sent_to: string | null;
    email_sent_language: string | null;
    email_send_count: number;
    zugferd_file_path: string | null;
    zugferd_generated_at: string | null;
    zugferd_profile: string | null;
    zugferd_standard_version: string | null;
    zugferd_validation_status: "valid" | "invalid" | "pending" | null;
    zugferd_validated_at: string | null;
    zugferd_validation_summary: Record<string, unknown> | null;
    zugferd_sha256: string | null;
    zugferd_email_sent_at: string | null;
    zugferd_email_sent_to: string | null;
    zugferd_email_sent_language: string | null;
    zugferd_email_send_count: number;
    created_at: string;
};

export type RequiredDocumentStatus = RequiredDocumentDefinition & {
    isAvailable: boolean;
    document: SaleDetailDocument | null;
};

export type SaleDetail = {
    id: string;
    sale_date: string;
    sale_type: SaleType;
    status: SaleStatus;
    payment_status: PaymentStatus;
    datev_status: DatevStatus;
    notes: string | null;
    invoice_notes: string | null;
    include_damage_notes_on_invoice: boolean;
    has_signature_stamp_assets: boolean;

    net_amount: number;
    vat_rate: number;
    vat_amount: number;
    gross_amount: number;
    profit_net: number;

    customer: {
        id: string;
        type: "company" | "private";
        name: string;
        street: string | null;
        postal_code: string | null;
        city: string | null;
        country: string | null;
        email: string | null;
        preferred_language: string;
        phone: string | null;
        tax_number: string | null;
        vat_id: string | null;
    };

    vehicle: {
        id: string;
        internal_number: string;
        name: string;
        vehicle_type: string;
        vin: string;
        license_plate: string | null;
        construction_year: number | null;
        first_registration: string | null;
        purchase_price_net: number;
        sale_price_net: number | null;
        additional_costs_net: number;
        damage_notes: string | null;
    };

    invoice: SaleDetailInvoice | null;
    invoices: SaleDetailInvoice[];

    documents: SaleDetailDocument[];
    required_documents: RequiredDocumentStatus[];
    required_documents_count: number;
    available_required_documents_count: number;
    missing_required_documents_count: number;
    missing_required_labels: string[];
    missing_required_data_labels: string[];
};

function getManyRelation<T>(relation: SupabaseRelation<T>): T[] {
    if (!relation) return [];

    if (Array.isArray(relation)) {
        return relation;
    }

    return [relation];
}

function getCustomerName(customer: SaleDetailQueryRow["customers"]): string {
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

function getInvoiceSortWeight(invoiceType: InvoiceType): number {
    const weights: Record<InvoiceType, number> = {
        standard: 1,
        proforma: 2,
        down_payment: 3,
    };

    return weights[invoiceType];
}

export async function getSaleDetail(saleId: string): Promise<SaleDetail> {
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
      datev_status,
      notes,
      invoice_notes,
      include_damage_notes_on_invoice,
      created_at,
      companies (
        signature_image_path,
        stamp_image_path
      ),
      vehicles (
        internal_number,
        manufacturer,
        model,
        vehicle_type,
        vin,
        license_plate,
        construction_year,
        first_registration,
        purchase_price_net,
        sale_price_net,
        additional_costs_net,
        damage_notes
      ),
      customers:buyer_customer_id (
        type,
        company_name,
        first_name,
        last_name,
        street,
        postal_code,
        city,
        country,
        email,
        preferred_language,
        phone,
        tax_number,
        vat_id
      ),
      invoices (
        id,
        invoice_type,
        invoice_number,
        invoice_date,
        net_amount,
        vat_amount,
        gross_amount,
        payment_status,
        include_signature_stamp,
        pdf_document_id,
        email_sent_at,
        email_sent_to,
        email_sent_language,
        email_send_count,
        zugferd_file_path,
        zugferd_generated_at,
        zugferd_profile,
        zugferd_standard_version,
        zugferd_validation_status,
        zugferd_validated_at,
        zugferd_validation_summary,
        zugferd_sha256,
        zugferd_email_sent_at,
        zugferd_email_sent_to,
        zugferd_email_sent_language,
        zugferd_email_send_count,
        created_at
      ),
      documents (
        id,
        document_type,
        source,
        status,
        file_name,
        file_path,
        mime_type,
        file_size,
        created_at
      )
    `,
        )
        .eq("id", saleId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) {
        notFound();
    }

    const sale = data as unknown as SaleDetailQueryRow;

    if (!sale.vehicles || !sale.customers) {
        throw new Error("Verkaufsakte ist unvollständig. Kunde oder Fahrzeug fehlt.");
    }

    const invoices = getManyRelation(sale.invoices)
        .map((invoice) => ({
            id: invoice.id,
            invoice_type: invoice.invoice_type ?? "standard",
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            net_amount: Number(invoice.net_amount),
            vat_amount: Number(invoice.vat_amount),
            gross_amount: Number(invoice.gross_amount),
            payment_status: invoice.payment_status,
            include_signature_stamp: Boolean(invoice.include_signature_stamp),
            pdf_document_id: invoice.pdf_document_id,
            email_sent_at: invoice.email_sent_at,
            email_sent_to: invoice.email_sent_to,
            email_sent_language: invoice.email_sent_language,
            email_send_count: invoice.email_send_count ?? 0,
            zugferd_file_path: invoice.zugferd_file_path,
            zugferd_generated_at: invoice.zugferd_generated_at,
            zugferd_profile: invoice.zugferd_profile,
            zugferd_standard_version: invoice.zugferd_standard_version,
            zugferd_validation_status: invoice.zugferd_validation_status,
            zugferd_validated_at: invoice.zugferd_validated_at,
            zugferd_validation_summary: invoice.zugferd_validation_summary,
            zugferd_sha256: invoice.zugferd_sha256,
            zugferd_email_sent_at: invoice.zugferd_email_sent_at,
            zugferd_email_sent_to: invoice.zugferd_email_sent_to,
            zugferd_email_sent_language: invoice.zugferd_email_sent_language,
            zugferd_email_send_count: invoice.zugferd_email_send_count ?? 0,
            created_at: invoice.created_at,
        }))
        .sort((a, b) => {
            const typeSort =
                getInvoiceSortWeight(a.invoice_type) -
                getInvoiceSortWeight(b.invoice_type);

            if (typeSort !== 0) return typeSort;

            return a.created_at.localeCompare(b.created_at);
        });

    const mainInvoice =
        invoices.find((invoice) => invoice.invoice_type === "standard") ??
        invoices[0] ??
        null;

    const documents = getManyRelation(sale.documents).map((document) => ({
        id: document.id,
        document_type: document.document_type,
        source: document.source,
        status: document.status,
        file_name: document.file_name,
        file_path: document.file_path,
        mime_type: document.mime_type,
        file_size: document.file_size,
        created_at: document.created_at,
    }));

    const saleType = sale.sale_type ?? "inland";

    const requiredDocuments = getRequiredDocumentsForSale({
        saleType,
        isCompanyCustomer: sale.customers.type === "company",
    });

    const requiredDocumentStatuses = requiredDocuments.map((requiredDocument) => {
        const acceptedDocumentTypes =
            requiredDocument.acceptedDocumentTypes ?? [
                requiredDocument.documentType,
            ];

        const matchingDocument =
            documents.find(
                (document) =>
                    acceptedDocumentTypes.includes(document.document_type) &&
                    document.status === "available",
            ) ?? null;

        return {
            ...requiredDocument,
            isAvailable: Boolean(matchingDocument),
            document: matchingDocument,
        };
    });

    const availableRequiredDocumentsCount = requiredDocumentStatuses.filter(
        (document) => document.isAvailable,
    ).length;
    const missingRequiredLabels = requiredDocumentStatuses
        .filter((document) => !document.isAvailable)
        .map((document) => document.label);

    const missingRequiredDataLabels = [
        saleType === "inland" && !sale.customers.tax_number
            ? "Steuernummer beim Kunden fehlt."
            : null,
        saleType === "eu" && !sale.customers.vat_id
            ? "USt-IdNr. beim Kunden fehlt."
            : null,
    ].filter((label): label is string => Boolean(label));

    const purchasePriceNet = Number(sale.vehicles.purchase_price_net ?? 0);
    const additionalCostsNet = Number(sale.vehicles.additional_costs_net ?? 0);
    const netAmount = Number(sale.net_amount);

    return {
        id: sale.id,
        sale_date: sale.sale_date,
        sale_type: saleType,
        status: sale.status,
        payment_status: sale.payment_status,
        datev_status: sale.datev_status,
        notes: sale.notes,
        invoice_notes: sale.invoice_notes,
        include_damage_notes_on_invoice: Boolean(
            sale.include_damage_notes_on_invoice,
        ),
        has_signature_stamp_assets: Boolean(
            sale.companies?.signature_image_path && sale.companies?.stamp_image_path,
        ),

        net_amount: netAmount,
        vat_rate: Number(sale.vat_rate),
        vat_amount: Number(sale.vat_amount),
        gross_amount: Number(sale.gross_amount),
        profit_net: netAmount - purchasePriceNet - additionalCostsNet,

        customer: {
            id: sale.buyer_customer_id,
            type: sale.customers.type,
            name: getCustomerName(sale.customers),
            street: sale.customers.street,
            postal_code: sale.customers.postal_code,
            city: sale.customers.city,
            country: sale.customers.country,
            email: sale.customers.email,
            preferred_language: sale.customers.preferred_language,
            phone: sale.customers.phone,
            tax_number: sale.customers.tax_number,
            vat_id: sale.customers.vat_id,
        },

        vehicle: {
            id: sale.vehicle_id,
            internal_number: sale.vehicles.internal_number,
            name: `${sale.vehicles.manufacturer} ${sale.vehicles.model}`,
            vehicle_type: sale.vehicles.vehicle_type,
            vin: sale.vehicles.vin,
            license_plate: sale.vehicles.license_plate,
            construction_year: sale.vehicles.construction_year,
            first_registration: sale.vehicles.first_registration,
            purchase_price_net: purchasePriceNet,
            sale_price_net:
                sale.vehicles.sale_price_net === null
                    ? null
                    : Number(sale.vehicles.sale_price_net),
            additional_costs_net: additionalCostsNet,
            damage_notes: sale.vehicles.damage_notes,
        },

        invoice: mainInvoice,
        invoices,

        documents,
        required_documents: requiredDocumentStatuses,
        required_documents_count: requiredDocumentStatuses.length,
        available_required_documents_count: availableRequiredDocumentsCount,
        missing_required_documents_count:
            requiredDocumentStatuses.length - availableRequiredDocumentsCount,
        missing_required_labels: missingRequiredLabels,
        missing_required_data_labels: missingRequiredDataLabels,
    };
}
