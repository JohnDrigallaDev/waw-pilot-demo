"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SaleUploadQueryResult = {
    id: string;
    vehicle_id: string;
    buyer_customer_id: string;
};

type ExistingDocumentQueryResult = {
    id: string;
    file_path: string | null;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function sanitizeFileName(fileName: string): string {
    return fileName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9.\-_]/g, "");
}

function getFileExtension(fileName: string): string {
    const parts = fileName.split(".");
    const extension = parts.length > 1 ? parts.pop() : null;

    return extension ? `.${extension}` : "";
}

export async function uploadSaleDocumentAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const saleId = getStringValue(formData, "sale_id");
    const documentType = getStringValue(formData, "document_type");
    const documentLabel = getStringValue(formData, "document_label") ?? documentType;
    const existingDocumentId = getStringValue(formData, "existing_document_id");
    const fileValue = formData.get("file");

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    if (!documentType) {
        throw new Error("Dokumenttyp fehlt.");
    }

    if (!(fileValue instanceof File) || fileValue.size === 0) {
        throw new Error("Bitte wähle eine Datei aus.");
    }

    const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("id, vehicle_id, buyer_customer_id")
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

    const sale = saleData as SaleUploadQueryResult;

    let existingDocument: ExistingDocumentQueryResult | null = null;

    if (existingDocumentId) {
        const { data: existingDocumentData, error: existingDocumentError } =
            await supabase
                .from("documents")
                .select("id, file_path")
                .eq("id", existingDocumentId)
                .eq("company_id", companyId)
                .eq("sale_id", saleId)
                .single();

        if (existingDocumentError || !existingDocumentData) {
            throw new Error(
                `Bestehendes Dokument konnte nicht geladen werden: ${
                    existingDocumentError?.message ?? "Nicht gefunden"
                }`,
            );
        }

        existingDocument = existingDocumentData as ExistingDocumentQueryResult;
    }

    const originalFileName = sanitizeFileName(fileValue.name);
    const fileExtension = getFileExtension(originalFileName);
    const timestamp = Date.now();

    const fileName = `${documentType}-${timestamp}${fileExtension}`;
    const filePath = `sales/${saleId}/${fileName}`;
    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileBuffer, {
            contentType: fileValue.type || "application/octet-stream",
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`Datei konnte nicht hochgeladen werden: ${uploadError.message}`);
    }

    const displayFileName = documentLabel
        ? `${documentLabel} - ${originalFileName}`
        : originalFileName;

    if (existingDocument) {
        const { error: documentUpdateError } = await supabase
            .from("documents")
            .update({
                source: "uploaded",
                status: "available",
                file_name: displayFileName,
                file_path: filePath,
                mime_type: fileValue.type || null,
                file_size: fileValue.size,
                customer_id: sale.buyer_customer_id,
                vehicle_id: sale.vehicle_id,
                sale_id: sale.id,
                generated_by_system: false,
            })
            .eq("id", existingDocument.id)
            .eq("company_id", companyId);

        if (documentUpdateError) {
            await supabase.storage.from("documents").remove([filePath]);

            throw new Error(
                `Neue Datei wurde hochgeladen, aber Dokument konnte nicht aktualisiert werden: ${documentUpdateError.message}`,
            );
        }

        if (existingDocument.file_path && existingDocument.file_path !== filePath) {
            await supabase.storage.from("documents").remove([existingDocument.file_path]);
        }
    } else {
        const { error: documentError } = await supabase.from("documents").insert({
            company_id: companyId,
            document_type: documentType,
            source: "uploaded",
            status: "available",
            file_name: displayFileName,
            file_path: filePath,
            mime_type: fileValue.type || null,
            file_size: fileValue.size,
            customer_id: sale.buyer_customer_id,
            vehicle_id: sale.vehicle_id,
            sale_id: sale.id,
            invoice_id: null,
            generated_by_system: false,
        });

        if (documentError) {
            await supabase.storage.from("documents").remove([filePath]);

            throw new Error(
                `Dokument wurde hochgeladen, aber nicht gespeichert: ${documentError.message}`,
            );
        }
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/sales/${saleId}`);
}