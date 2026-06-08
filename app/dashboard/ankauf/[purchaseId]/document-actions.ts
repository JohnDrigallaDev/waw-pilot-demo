"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UploadPurchaseDocumentState = {
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
        "purchase_invoice",
        "purchase_contract",
        "purchase_receipt",
        "purchase_payment_proof",
        "seller_id",
        "seller_commercial_register",
    ].includes(documentType);
}

export async function uploadPurchaseDocumentAction(
    _previousState: UploadPurchaseDocumentState,
    formData: FormData,
): Promise<UploadPurchaseDocumentState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const purchaseId = getStringValue(formData, "purchase_id");
    const documentType = getStringValue(formData, "document_type");
    const existingDocumentId = getStringValue(formData, "existing_document_id");
    const fileValue = formData.get("file");

    if (!purchaseId) {
        return {
            success: false,
            message: "Ankaufsakte fehlt.",
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

    const { data: purchaseCase, error: purchaseCaseError } = await supabase
        .from("purchase_cases")
        .select("id, vehicle_id, seller_customer_id")
        .eq("id", purchaseId)
        .eq("company_id", companyId)
        .single();

    if (purchaseCaseError || !purchaseCase) {
        return {
            success: false,
            message: `Ankaufsakte konnte nicht geladen werden: ${
                purchaseCaseError?.message ?? "Nicht gefunden"
            }`,
        };
    }

    const originalFileName = sanitizeFileName(fileValue.name);
    const fileExtension = getFileExtension(originalFileName);
    const timestamp = Date.now();

    const fileName = `${documentType}-${timestamp}${fileExtension}`;
    const filePath = `purchases/${purchaseId}/${fileName}`;
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
                customer_id: purchaseCase.seller_customer_id,
                vehicle_id: purchaseCase.vehicle_id,
                sale_id: null,
                invoice_id: null,
                purchase_case_id: purchaseId,
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
            customer_id: purchaseCase.seller_customer_id,
            vehicle_id: purchaseCase.vehicle_id,
            sale_id: null,
            invoice_id: null,
            purchase_case_id: purchaseId,
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

    const { data: purchaseDocuments } = await supabase
        .from("documents")
        .select("document_type, status")
        .eq("company_id", companyId)
        .eq("purchase_case_id", purchaseId);

    const requiredDocumentTypes = [
        "purchase_invoice",
        "purchase_contract",
        "seller_id",
    ];

    const hasAllRequiredDocuments = requiredDocumentTypes.every((requiredType) =>
        (purchaseDocuments ?? []).some(
            (document) =>
                document.document_type === requiredType &&
                document.status === "available",
        ),
    );

    await supabase
        .from("purchase_cases")
        .update({
            document_check_status: hasAllRequiredDocuments
                ? "complete"
                : "missing",
            updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId)
        .eq("company_id", companyId);

    revalidatePath(`/dashboard/ankauf/${purchaseId}`);
    revalidatePath("/dashboard/ankauf");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/checks");
    revalidatePath("/dashboard");

    redirect(`/dashboard/ankauf/${purchaseId}`);
}