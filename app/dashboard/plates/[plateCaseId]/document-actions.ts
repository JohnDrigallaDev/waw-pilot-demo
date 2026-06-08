"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UploadLicensePlateDocumentState = {
    success: boolean;
    message: string;
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

function isAllowedDocumentType(documentType: string): boolean {
    return [
        "license_plate_document",
        "license_plate_insurance",
        "license_plate_power_of_attorney",
        "license_plate_registration",
    ].includes(documentType);
}

export async function uploadLicensePlateDocumentAction(
    _previousState: UploadLicensePlateDocumentState,
    formData: FormData,
): Promise<UploadLicensePlateDocumentState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const plateCaseId = getStringValue(formData, "plate_case_id");
    const documentType = getStringValue(formData, "document_type");
    const existingDocumentId = getStringValue(formData, "existing_document_id");
    const fileValue = formData.get("file");

    if (!plateCaseId) {
        return {
            success: false,
            message: "Kennzeichen-Vorgang fehlt.",
        };
    }

    if (!documentType || !isAllowedDocumentType(documentType)) {
        return {
            success: false,
            message: "Ungültiger Dokumenttyp.",
        };
    }

    if (!(fileValue instanceof File) || fileValue.size <= 0) {
        return {
            success: false,
            message: "Bitte wähle eine Datei aus.",
        };
    }

    const { data: plateCase, error: plateCaseError } = await supabase
        .from("license_plate_cases")
        .select("id, vehicle_id, customer_id, sale_id")
        .eq("id", plateCaseId)
        .eq("company_id", companyId)
        .single();

    if (plateCaseError || !plateCase) {
        return {
            success: false,
            message: `Kennzeichen-Vorgang konnte nicht geladen werden: ${
                plateCaseError?.message ?? "Nicht gefunden"
            }`,
        };
    }

    const originalFileName = sanitizeFileName(fileValue.name);
    const fileExtension = getFileExtension(originalFileName);
    const timestamp = Date.now();

    const fileName = `${documentType}-${timestamp}${fileExtension}`;
    const filePath = `license-plates/${plateCaseId}/${fileName}`;
    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

    let oldFilePath: string | null = null;

    if (existingDocumentId) {
        const { data: existingDocument } = await supabase
            .from("documents")
            .select("file_path")
            .eq("id", existingDocumentId)
            .eq("company_id", companyId)
            .maybeSingle();

        oldFilePath = existingDocument?.file_path ?? null;
    }

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileBuffer, {
            contentType: fileValue.type || "application/octet-stream",
            upsert: false,
        });

    if (uploadError) {
        return {
            success: false,
            message: `Datei konnte nicht hochgeladen werden: ${uploadError.message}`,
        };
    }

    if (existingDocumentId) {
        const { error: updateError } = await supabase
            .from("documents")
            .update({
                document_type: documentType,
                source: "uploaded",
                status: "available",
                file_name: originalFileName,
                file_path: filePath,
                mime_type: fileValue.type || null,
                file_size: fileValue.size,
                customer_id: plateCase.customer_id,
                vehicle_id: plateCase.vehicle_id,
                sale_id: plateCase.sale_id,
                invoice_id: null,
                license_plate_case_id: plateCaseId,
                generated_by_system: false,
            })
            .eq("id", existingDocumentId)
            .eq("company_id", companyId);

        if (updateError) {
            await supabase.storage.from("documents").remove([filePath]);

            return {
                success: false,
                message: `Dokument konnte nicht aktualisiert werden: ${updateError.message}`,
            };
        }

        if (oldFilePath && oldFilePath !== filePath) {
            await supabase.storage.from("documents").remove([oldFilePath]);
        }
    } else {
        const { error: insertError } = await supabase.from("documents").insert({
            company_id: companyId,
            document_type: documentType,
            source: "uploaded",
            status: "available",
            file_name: originalFileName,
            file_path: filePath,
            mime_type: fileValue.type || null,
            file_size: fileValue.size,
            customer_id: plateCase.customer_id,
            vehicle_id: plateCase.vehicle_id,
            sale_id: plateCase.sale_id,
            invoice_id: null,
            license_plate_case_id: plateCaseId,
            generated_by_system: false,
        });

        if (insertError) {
            await supabase.storage.from("documents").remove([filePath]);

            return {
                success: false,
                message: `Dokument konnte nicht gespeichert werden: ${insertError.message}`,
            };
        }
    }

    revalidatePath(`/dashboard/plates/${plateCaseId}`);
    revalidatePath("/dashboard/plates");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/plates/${plateCaseId}`);
}