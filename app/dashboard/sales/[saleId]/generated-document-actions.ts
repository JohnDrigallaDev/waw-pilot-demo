"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import {
    type GeneratedDocumentType,
} from "@/lib/pdf/generated-documents/document-types";
import { generateAndStoreSaleGeneratedDocument } from "@/lib/pdf/generated-documents/sale-generated-document-storage";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    getInvoiceTypeDocumentType,
    getNextInvoiceNumber,
} from "@/lib/invoices/invoice-numbering";
import { generateAndStoreInvoicePdf } from "@/lib/pdf/invoice-storage";

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getGeneratedDocumentType(
    value: string | null,
): GeneratedDocumentType | null {
    if (
        value === "invoice_pdf" ||
        value === "proforma_invoice" ||
        value === "handover_protocol" ||
        value === "entry_certificate" ||
        value === "transport_proof" ||
        value === "license_plate_consent" ||
        value === "travel_expense_form" ||
        value === "purchase_contract" ||
        value === "sales_contract" ||
        value === "abd_checklist" ||
        value === "exit_note_checklist"
    ) {
        return value;
    }

    return null;
}

function getGeneratedDocumentActivityLabel(
    documentType: GeneratedDocumentType,
): string {
    const labels: Record<GeneratedDocumentType, string> = {
        invoice_pdf: "Rechnung",
        proforma_invoice: "Proforma-Rechnung",
        handover_protocol: "Übergabeprotokoll",
        entry_certificate: "Gelangensbestätigung",
        transport_proof: "Verbringungsnachweis",
        license_plate_consent: "Einverständniserklärung Kennzeichen",
        travel_expense_form: "Reisekostenformular",
        purchase_contract: "Ankaufsvertrag",
        sales_contract: "Kaufvertrag",
        abd_checklist: "ABD-Checkliste",
        exit_note_checklist: "Ausgangsvermerk-Checkliste",
    };

    return labels[documentType] ?? documentType;
}

function addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
}

async function createProformaInvoiceForSale(saleId: string) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data: existingInvoice, error: existingInvoiceError } = await supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("company_id", companyId)
        .eq("sale_id", saleId)
        .eq("invoice_type", "proforma")
        .maybeSingle();

    if (existingInvoiceError) {
        throw new Error(
            `Vorhandene Proforma-Rechnung konnte nicht geprüft werden: ${existingInvoiceError.message}`,
        );
    }

    if (existingInvoice?.id) {
        const storedPdf = await generateAndStoreInvoicePdf(existingInvoice.id as string);

        await logActivity({
            action: `Proforma-Rechnung ${
                existingInvoice.invoice_number ?? existingInvoice.id
            } für Verkauf neu erzeugt`,
            entityType: "invoice",
            entityId: existingInvoice.id as string,
        });

        return {
            invoiceId: existingInvoice.id as string,
            fileName: storedPdf.fileName,
            filePath: storedPdf.filePath,
        };
    }

    const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select(
            `
            id,
            company_id,
            buyer_customer_id,
            vehicle_id,
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
            `Verkauf konnte für Proforma-Rechnung nicht geladen werden: ${
                saleError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const invoiceNumber = await getNextInvoiceNumber({
        invoiceType: "proforma",
        invoiceDate: saleData.sale_date,
    });

    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
            company_id: companyId,
            sale_id: saleId,
            customer_id: saleData.buyer_customer_id,
            vehicle_id: saleData.vehicle_id,
            invoice_type: "proforma",
            invoice_number: invoiceNumber,
            invoice_date: saleData.sale_date,
            due_date: addDays(saleData.sale_date, 7),
            net_amount: Number(saleData.net_amount),
            vat_rate: Number(saleData.vat_rate),
            vat_amount: Number(saleData.vat_amount),
            gross_amount: Number(saleData.gross_amount),
            status: "created",
            payment_status: "open",
            datev_status: "not_sent",
            paid_at: null,
        })
        .select("id")
        .single();

    if (invoiceError || !invoice) {
        throw new Error(
            `Proforma-Rechnung konnte nicht angelegt werden: ${
                invoiceError?.message ?? "Keine Rechnungs-ID erhalten"
            }`,
        );
    }

    const invoiceId = invoice.id as string;
    const invoiceFileName = `proforma-rechnung-${invoiceNumber}.pdf`;
    const invoiceFilePath = `invoices/${invoiceFileName}`;

    const { data: invoiceDocument, error: documentError } = await supabase
        .from("documents")
        .insert({
            company_id: companyId,
            document_type: getInvoiceTypeDocumentType("proforma"),
            source: "generated",
            status: "needs_review",
            file_name: invoiceFileName,
            file_path: invoiceFilePath,
            mime_type: "application/pdf",
            file_size: null,
            customer_id: saleData.buyer_customer_id,
            vehicle_id: saleData.vehicle_id,
            sale_id: saleId,
            invoice_id: invoiceId,
            generated_by_system: true,
        })
        .select("id")
        .single();

    if (documentError || !invoiceDocument) {
        throw new Error(
            `Proforma-Dokument konnte nicht angelegt werden: ${
                documentError?.message ?? "Keine Dokument-ID erhalten"
            }`,
        );
    }

    const documentId = invoiceDocument.id as string;

    const { error: invoiceDocumentLinkError } = await supabase
        .from("invoices")
        .update({
            pdf_document_id: documentId,
        })
        .eq("id", invoiceId)
        .eq("company_id", companyId);

    if (invoiceDocumentLinkError) {
        throw new Error(
            `Proforma-Dokument wurde angelegt, aber nicht mit der Rechnung verknüpft: ${invoiceDocumentLinkError.message}`,
        );
    }

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
            `Proforma-PDF wurde gespeichert, aber Dokumentdaten konnten nicht aktualisiert werden: ${documentUpdateError.message}`,
        );
    }

    await logActivity({
        action: `Proforma-Rechnung ${invoiceNumber} für Verkauf erzeugt`,
        entityType: "invoice",
        entityId: invoiceId,
    });

    await logActivity({
        action: `Proforma-Dokument ${invoiceNumber} erzeugt`,
        entityType: "document",
        entityId: documentId,
    });

    return {
        invoiceId,
        fileName: storedPdf.fileName,
        filePath: storedPdf.filePath,
    };
}

export async function generateSaleDocumentAction(formData: FormData) {
    const saleId = getStringValue(formData, "sale_id");
    const documentType = getGeneratedDocumentType(
        getStringValue(formData, "document_type"),
    );

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    if (!documentType) {
        throw new Error("Dokumenttyp fehlt oder wird nicht unterstützt.");
    }

    if (documentType === "proforma_invoice") {
        await createProformaInvoiceForSale(saleId);
    } else {
        const generatedDocument = await generateAndStoreSaleGeneratedDocument({
            saleId,
            documentType,
        });

        await logActivity({
            action: `${getGeneratedDocumentActivityLabel(
                documentType,
            )} für Verkauf erzeugt`,
            entityType: "document",
            entityId: generatedDocument.documentId,
        });
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/checks");
    revalidatePath("/dashboard/activities");

    redirect(
        `/dashboard/sales/${saleId}?generatedDocument=${encodeURIComponent(
            documentType,
        )}&refresh=${Date.now()}#automatic-documents`,
    );
}