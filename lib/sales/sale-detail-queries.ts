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
    pdf_document_id: string | null;
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
    created_at: string;

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
        additional_costs_net: number | string;
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
    pdf_document_id: string | null;
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
        additional_costs_net: number;
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
      created_at,
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
        additional_costs_net
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
        pdf_document_id,
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
            pdf_document_id: invoice.pdf_document_id,
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
            additional_costs_net: additionalCostsNet,
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
