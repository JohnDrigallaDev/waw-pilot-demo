"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import {
    getInvoiceTypeDocumentType,
    getInvoiceTypeLabel,
    getNextInvoiceNumber,
    type InvoiceType,
} from "@/lib/invoices/invoice-numbering";
import { generateAndStoreInvoicePdf } from "@/lib/pdf/invoice-storage";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SaleInvoiceSourceRow = {
    id: string;
    company_id: string;
    vehicle_id: string;
    buyer_customer_id: string;
    sale_date: string;
    net_amount: number | string;
    vat_rate: number | string;
    vat_amount: number | string;
    gross_amount: number | string;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getInvoiceTypeValue(formData: FormData): InvoiceType {
    const value = getStringValue(formData, "invoice_type");

    if (
        value === "standard" ||
        value === "proforma" ||
        value === "down_payment"
    ) {
        return value;
    }

    return "standard";
}

function addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
}

function getInvoiceFileBaseName(invoiceType: InvoiceType): string {
    const fileBaseNames: Record<InvoiceType, string> = {
        standard: "rechnung",
        proforma: "proforma-rechnung",
        down_payment: "anzahlungsrechnung",
    };

    return fileBaseNames[invoiceType];
}

export async function createSaleInvoiceAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const saleId = getStringValue(formData, "sale_id");
    const invoiceType = getInvoiceTypeValue(formData);

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select(
            `
      id,
      company_id,
      vehicle_id,
      buyer_customer_id,
      sale_date,
      net_amount,
      vat_rate,
      vat_amount,
      gross_amount
    `,
        )
        .eq("id", saleId)
        .eq("company_id", companyId)
        .single();

    if (saleError || !saleData) {
        throw new Error(
            `Verkauf konnte nicht geladen werden: ${
                saleError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const sale = saleData as SaleInvoiceSourceRow;

    const { data: existingInvoiceData, error: existingInvoiceError } =
        await supabase
            .from("invoices")
            .select("id, invoice_number")
            .eq("company_id", companyId)
            .eq("sale_id", saleId)
            .eq("invoice_type", invoiceType)
            .maybeSingle();

    if (existingInvoiceError) {
        throw new Error(
            `Vorhandene ${getInvoiceTypeLabel(invoiceType)} konnte nicht geprüft werden: ${
                existingInvoiceError.message
            }`,
        );
    }

    if (existingInvoiceData) {
        revalidatePath(`/dashboard/sales/${saleId}`);
        revalidatePath("/dashboard/invoices");
        revalidatePath("/dashboard/documents");

        redirect(`/dashboard/sales/${saleId}`);
    }

    const invoiceNumber = await getNextInvoiceNumber({
        invoiceType,
        invoiceDate: sale.sale_date,
    });

    const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
            company_id: companyId,
            sale_id: sale.id,
            customer_id: sale.buyer_customer_id,
            vehicle_id: sale.vehicle_id,
            invoice_type: invoiceType,
            invoice_number: invoiceNumber,
            invoice_date: sale.sale_date,
            due_date: addDays(sale.sale_date, 7),
            net_amount: Number(sale.net_amount),
            vat_rate: Number(sale.vat_rate),
            vat_amount: Number(sale.vat_amount),
            gross_amount: Number(sale.gross_amount),
            status: "created",
            payment_status: "open",
            datev_status: "not_sent",
            paid_at: null,
        })
        .select("id")
        .single();

    if (invoiceError || !invoiceData) {
        throw new Error(
            `${getInvoiceTypeLabel(invoiceType)} konnte nicht erzeugt werden: ${
                invoiceError?.message ?? "Keine Rechnungs-ID erhalten"
            }`,
        );
    }

    const invoiceId = invoiceData.id as string;

    const fileBaseName = getInvoiceFileBaseName(invoiceType);
    const invoiceFileName = `${fileBaseName}-${invoiceNumber}.pdf`;
    const invoiceFilePath = `invoices/${invoiceFileName}`;

    const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
            company_id: companyId,
            document_type: getInvoiceTypeDocumentType(invoiceType),
            source: "generated",
            status: "needs_review",
            file_name: invoiceFileName,
            file_path: invoiceFilePath,
            mime_type: "application/pdf",
            file_size: null,
            customer_id: sale.buyer_customer_id,
            vehicle_id: sale.vehicle_id,
            sale_id: sale.id,
            invoice_id: invoiceId,
            generated_by_system: true,
        })
        .select("id")
        .single();

    if (documentError || !documentData) {
        throw new Error(
            `${getInvoiceTypeLabel(invoiceType)} wurde erzeugt, aber Dokument konnte nicht angelegt werden: ${
                documentError?.message ?? "Keine Dokument-ID erhalten"
            }`,
        );
    }

    const documentId = documentData.id as string;

    const { error: invoiceDocumentLinkError } = await supabase
        .from("invoices")
        .update({
            pdf_document_id: documentId,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

    if (invoiceDocumentLinkError) {
        throw new Error(
            `Dokument wurde angelegt, aber nicht mit der Rechnung verknüpft: ${invoiceDocumentLinkError.message}`,
        );
    }

    try {
        const storedPdf = await generateAndStoreInvoicePdf(invoiceId);

        const { error: documentUpdateError } = await supabase
            .from("documents")
            .update({
                status: "available",
                file_name: storedPdf.fileName,
                file_path: storedPdf.filePath,
                file_size: storedPdf.fileSize,
            })
            .eq("id", documentId)
            .eq("company_id", companyId);

        if (documentUpdateError) {
            throw new Error(
                `PDF wurde gespeichert, aber Dokumentdaten konnten nicht aktualisiert werden: ${documentUpdateError.message}`,
            );
        }
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "PDF konnte nicht im Storage gespeichert werden.",
        );
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/sales/${saleId}`);
}

export async function regenerateSaleInvoicePdfAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const saleId = getStringValue(formData, "sale_id");
    const invoiceId = getStringValue(formData, "invoice_id");

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    if (!invoiceId) {
        throw new Error("Rechnung fehlt.");
    }

    const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(
            `
      id,
      sale_id,
      pdf_document_id
    `,
        )
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

    if (invoiceError || !invoiceData) {
        throw new Error(
            `Rechnung konnte nicht geladen werden: ${
                invoiceError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const storedPdf = await generateAndStoreInvoicePdf(invoiceId);

    if (invoiceData.pdf_document_id) {
        const { error: documentUpdateError } = await supabase
            .from("documents")
            .update({
                status: "available",
                file_name: storedPdf.fileName,
                file_path: storedPdf.filePath,
                file_size: storedPdf.fileSize,
                mime_type: "application/pdf",
            })
            .eq("id", invoiceData.pdf_document_id)
            .eq("company_id", companyId);

        if (documentUpdateError) {
            throw new Error(
                `PDF wurde erzeugt, aber Dokument konnte nicht aktualisiert werden: ${documentUpdateError.message}`,
            );
        }
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/sales/${saleId}`);
}

export async function markInvoicePaidAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const saleId = getStringValue(formData, "sale_id");
    const invoiceId = getStringValue(formData, "invoice_id");
    const paymentMethod = getStringValue(formData, "payment_method") ?? "bank";

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    if (!invoiceId) {
        throw new Error("Rechnung fehlt.");
    }

    if (paymentMethod !== "bank" && paymentMethod !== "cash") {
        throw new Error("Ungültige Zahlungsart.");
    }

    const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select(
            `
      id,
      sale_id,
      customer_id,
      vehicle_id,
      invoice_type,
      invoice_number,
      gross_amount,
      payment_status,
      pdf_document_id
    `,
        )
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

    if (invoiceError || !invoiceData) {
        throw new Error(
            `Rechnung konnte nicht geladen werden: ${
                invoiceError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const invoiceType = invoiceData.invoice_type as InvoiceType;

    if (invoiceType === "proforma") {
        throw new Error("Proforma-Rechnungen werden nicht als bezahlt markiert.");
    }

    if (invoiceData.payment_status === "paid") {
        revalidatePath(`/dashboard/sales/${saleId}`);
        revalidatePath("/dashboard/invoices");
        revalidatePath("/dashboard/cashbook");

        redirect(`/dashboard/sales/${saleId}`);
    }

    const paidAt = new Date().toISOString();

    const { error: invoiceUpdateError } = await supabase
        .from("invoices")
        .update({
            status: "paid",
            payment_status: "paid",
            paid_at: paidAt,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

    if (invoiceUpdateError) {
        throw new Error(
            `Rechnung konnte nicht als bezahlt markiert werden: ${invoiceUpdateError.message}`,
        );
    }

    const salePaymentStatus = invoiceType === "down_payment" ? "partial" : "paid";

    const { error: saleUpdateError } = await supabase
        .from("sales")
        .update({
            payment_status: salePaymentStatus,
        })
        .eq("id", saleId)
        .eq("company_id", companyId);

    if (saleUpdateError) {
        throw new Error(
            `Verkauf wurde nicht aktualisiert: ${saleUpdateError.message}`,
        );
    }

    const { data: existingCashbookEntry, error: cashbookCheckError } =
        await supabase
            .from("cashbook_entries")
            .select("id")
            .eq("company_id", companyId)
            .eq("invoice_id", invoiceId)
            .maybeSingle();

    if (cashbookCheckError) {
        throw new Error(
            `Kassenbuch konnte nicht geprüft werden: ${cashbookCheckError.message}`,
        );
    }

    if (!existingCashbookEntry) {
        const description =
            invoiceType === "down_payment"
                ? `Zahlung Anzahlungsrechnung ${invoiceData.invoice_number}`
                : `Zahlung Rechnung ${invoiceData.invoice_number}`;

        const { error: cashbookInsertError } = await supabase
            .from("cashbook_entries")
            .insert({
                company_id: companyId,
                entry_type: "income",
                category: "vehicle_sale",
                payment_method: paymentMethod,
                amount: Number(invoiceData.gross_amount),
                booking_date: new Date().toISOString().slice(0, 10),
                description,
                customer_id: invoiceData.customer_id,
                vehicle_id: invoiceData.vehicle_id,
                sale_id: saleId,
                invoice_id: invoiceId,
                document_id: invoiceData.pdf_document_id,
            });

        if (cashbookInsertError) {
            throw new Error(
                `Kassenbuch-Eintrag konnte nicht erstellt werden: ${cashbookInsertError.message}`,
            );
        }
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/cashbook");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/sales/${saleId}`);
}