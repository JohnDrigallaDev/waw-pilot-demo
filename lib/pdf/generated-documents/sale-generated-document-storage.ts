import { getCurrentCompanyId } from "@/lib/company";
import {
    getGeneratedDocumentDefinition,
    isSupportedSaleGeneratedDocumentType,
    type GeneratedDocumentType,
} from "@/lib/pdf/generated-documents/document-types";
import { validateGeneratedDocumentData } from "@/lib/pdf/generated-documents/document-validation";
import { getSaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";
import { generateHandoverProtocolPdf } from "@/lib/pdf/templates/handover-protocol-pdf";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateEntryCertificatePdf } from "@/lib/pdf/templates/entry-certificate-pdf";
import { generateTransportProofPdf } from "@/lib/pdf/templates/transport-proof-pdf";

export type GenerateSaleDocumentResult = {
    documentId: string;
    fileName: string;
    filePath: string;
};

function getSafeFilePart(value: string | null | undefined): string {
    if (!value) return "ohne-nummer";

    return value
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function getSaleGeneratedDocumentFileBaseName(
    documentType: GeneratedDocumentType,
): string {
    const names: Record<GeneratedDocumentType, string> = {
        invoice_pdf: "rechnung",
        proforma_invoice: "proforma-rechnung",
        handover_protocol: "uebergabeprotokoll",
        entry_certificate: "gelangensbestaetigung",
        transport_proof: "verbringungsnachweis",
        license_plate_consent: "einverstaendniserklaerung-kennzeichen",
        travel_expense_form: "reisekostenformular",
        purchase_contract: "ankaufsvertrag",
        sales_contract: "kaufvertrag",
        abd_checklist: "abd-checkliste",
        exit_note_checklist: "ausgangsvermerk-checkliste",
    };

    return names[documentType];
}

async function generatePdfBytesForSaleDocument(
    documentType: GeneratedDocumentType,
    saleId: string,
) {
    const documentData = await getSaleGeneratedDocumentData(saleId);
    const validation = validateGeneratedDocumentData(documentType, documentData);

    if (!validation.canGenerate) {
        const messages = validation.missingFields
            .map((field) => field.message)
            .join(" ");

        throw new Error(
            `Dokument kann nicht erzeugt werden, weil Pflichtdaten fehlen: ${messages}`,
        );
    }

    if (documentType === "handover_protocol") {
        return {
            pdfBytes: await generateHandoverProtocolPdf(documentData),
            documentData,
        };
    }

    if (documentType === "entry_certificate") {
        return {
            pdfBytes: await generateEntryCertificatePdf(documentData),
            documentData,
        };
    }

    if (documentType === "transport_proof") {
        return {
            pdfBytes: await generateTransportProofPdf(documentData),
            documentData,
        };
    }

    throw new Error(
        "Dieser Dokumenttyp kann aktuell noch nicht automatisch erzeugt werden.",
    );
}

export async function generateAndStoreSaleGeneratedDocument(params: {
    saleId: string;
    documentType: GeneratedDocumentType;
}): Promise<GenerateSaleDocumentResult> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    if (!isSupportedSaleGeneratedDocumentType(params.documentType)) {
        throw new Error(
            "Dieser Dokumenttyp kann in der Verkaufsakte nicht automatisch erzeugt werden.",
        );
    }

    const definition = getGeneratedDocumentDefinition(params.documentType);

    const { pdfBytes, documentData } = await generatePdfBytesForSaleDocument(
        params.documentType,
        params.saleId,
    );

    const fileBaseName = getSaleGeneratedDocumentFileBaseName(params.documentType);
    const numberPart = getSafeFilePart(
        documentData.sale?.invoiceNumber ?? params.saleId,
    );

    const fileName = `${fileBaseName}-${numberPart}.pdf`;
    const filePath = `generated-documents/sales/${params.saleId}/${fileName}`;

    const [uploadResult, existingDocumentResult] = await Promise.all([
        supabase.storage.from("documents").upload(filePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
        }),
        supabase
            .from("documents")
            .select("id")
            .eq("company_id", companyId)
            .eq("sale_id", params.saleId)
            .eq("document_type", definition.documentType)
            .eq("source", "generated")
            .maybeSingle(),
    ]);

    if (uploadResult.error) {
        throw new Error(
            `PDF konnte nicht gespeichert werden: ${uploadResult.error.message}`,
        );
    }

    if (existingDocumentResult.error) {
        throw new Error(
            `Vorhandenes Dokument konnte nicht geprüft werden: ${existingDocumentResult.error.message}`,
        );
    }

    const existingDocument = existingDocumentResult.data;

    if (existingDocument?.id) {
        const { error: updateError } = await supabase
            .from("documents")
            .update({
                status: definition.requiresSignature ? "needs_review" : "available",
                file_name: fileName,
                file_path: filePath,
                mime_type: "application/pdf",
                file_size: pdfBytes.byteLength,
                customer_id: documentData.customerId,
                vehicle_id: documentData.vehicleId,
                generated_by_system: true,
            })
            .eq("id", existingDocument.id)
            .eq("company_id", companyId);

        if (updateError) {
            throw new Error(
                `Dokument konnte nicht aktualisiert werden: ${updateError.message}`,
            );
        }

        return {
            documentId: existingDocument.id,
            fileName,
            filePath,
        };
    }

    const { data: insertedDocument, error: insertError } = await supabase
        .from("documents")
        .insert({
            company_id: companyId,
            document_type: definition.documentType,
            source: "generated",
            status: definition.requiresSignature ? "needs_review" : "available",
            file_name: fileName,
            file_path: filePath,
            mime_type: "application/pdf",
            file_size: pdfBytes.byteLength,
            customer_id: documentData.customerId,
            vehicle_id: documentData.vehicleId,
            sale_id: params.saleId,
            generated_by_system: true,
        })
        .select("id")
        .single();

    if (insertError || !insertedDocument) {
        throw new Error(
            `Dokument konnte nicht angelegt werden: ${
                insertError?.message ?? "Keine Dokument-ID erhalten"
            }`,
        );
    }

    return {
        documentId: insertedDocument.id as string,
        fileName,
        filePath,
    };
}
