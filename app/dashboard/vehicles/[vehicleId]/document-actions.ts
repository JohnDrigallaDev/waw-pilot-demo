"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import {
    getDocumentTooLargeMessage,
    getDocumentUploadFailedMessage,
    getUnsupportedVehicleDocumentTypeMessage,
    isAllowedVehicleDocumentFile,
    maxDocumentFileSizeBytes,
} from "@/lib/documents/upload-validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type VehicleDocumentType = "vehicle_registration" | "purchase_invoice";

type ExistingVehicleDocument = {
    id: string;
    file_path: string | null;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getVehicleDocumentType(value: string | null): VehicleDocumentType | null {
    if (value === "vehicle_registration" || value === "purchase_invoice") {
        return value;
    }

    return null;
}

function getVehicleDocumentLabel(documentType: VehicleDocumentType): string {
    return documentType === "vehicle_registration"
        ? "Fahrzeugschein"
        : "Einkaufsrechnung";
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

async function getLatestVehicleDocument({
                                           vehicleId,
                                           documentType,
                                       }: {
    vehicleId: string;
    documentType: VehicleDocumentType;
}): Promise<ExistingVehicleDocument | null> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data } = await supabase
        .from("documents")
        .select("id, file_path")
        .eq("company_id", companyId)
        .eq("vehicle_id", vehicleId)
        .eq("document_type", documentType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return (data as ExistingVehicleDocument | null) ?? null;
}

export async function uploadVehicleDocumentAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const vehicleId = getStringValue(formData, "vehicle_id");
    const documentType = getVehicleDocumentType(
        getStringValue(formData, "document_type"),
    );
    const fileValue = formData.get("file");

    if (!vehicleId) {
        throw new Error("Fahrzeug fehlt.");
    }

    if (!documentType) {
        throw new Error("Ungültiger Dokumenttyp.");
    }

    if (!(fileValue instanceof File) || fileValue.size <= 0) {
        throw new Error("Bitte wähle eine Datei aus.");
    }

    if (!isAllowedVehicleDocumentFile(fileValue)) {
        throw new Error(getUnsupportedVehicleDocumentTypeMessage());
    }

    if (fileValue.size > maxDocumentFileSizeBytes) {
        throw new Error(getDocumentTooLargeMessage());
    }

    const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("id, seller_customer_id")
        .eq("id", vehicleId)
        .eq("company_id", companyId)
        .single();

    if (vehicleError || !vehicle) {
        throw new Error(
            `Fahrzeug konnte nicht geladen werden: ${
                vehicleError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    const existingDocument = await getLatestVehicleDocument({
        vehicleId,
        documentType,
    });

    const originalFileName = sanitizeFileName(fileValue.name);
    const fileExtension = getFileExtension(originalFileName);
    const fileName = `${documentType}-${Date.now()}${fileExtension}`;
    const filePath = `vehicles/${vehicleId}/${fileName}`;
    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileBuffer, {
            contentType: fileValue.type || "application/octet-stream",
            upsert: false,
        });

    if (uploadError) {
        console.error("[upload] vehicle document storage upload failed", uploadError);
        throw new Error(getDocumentUploadFailedMessage(uploadError));
    }

    const documentPayload = {
        document_type: documentType,
        source: "uploaded",
        status: "available",
        file_name: originalFileName || getVehicleDocumentLabel(documentType),
        file_path: filePath,
        mime_type: fileValue.type || null,
        file_size: fileValue.size,
        customer_id:
            documentType === "purchase_invoice"
                ? (vehicle.seller_customer_id as string | null)
                : null,
        vehicle_id: vehicleId,
        sale_id: null,
        invoice_id: null,
        generated_by_system: false,
    };

    if (existingDocument) {
        const { error: updateError } = await supabase
            .from("documents")
            .update(documentPayload)
            .eq("id", existingDocument.id)
            .eq("company_id", companyId);

        if (updateError) {
            await supabase.storage.from("documents").remove([filePath]);
            console.error("[upload] vehicle document update failed", updateError);
            throw new Error(
                "Dokument konnte nicht gespeichert werden. Bitte versuche es erneut.",
            );
        }

        if (existingDocument.file_path && existingDocument.file_path !== filePath) {
            await supabase.storage.from("documents").remove([existingDocument.file_path]);
        }
    } else {
        const { error: insertError } = await supabase.from("documents").insert({
            company_id: companyId,
            ...documentPayload,
        });

        if (insertError) {
            await supabase.storage.from("documents").remove([filePath]);
            console.error("[upload] vehicle document insert failed", insertError);
            throw new Error(
                "Dokument konnte nicht gespeichert werden. Bitte versuche es erneut.",
            );
        }
    }

    await logActivity({
        action: `${getVehicleDocumentLabel(documentType)} für Fahrzeug hochgeladen`,
        entityType: "document",
        entityId: vehicleId,
    });

    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/vehicles/${vehicleId}?vehicleDocumentUploaded=1`);
}

export async function deleteVehicleDocumentAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const vehicleId = getStringValue(formData, "vehicle_id");
    const documentId = getStringValue(formData, "document_id");

    if (!vehicleId) {
        throw new Error("Fahrzeug fehlt.");
    }

    if (!documentId) {
        throw new Error("Dokument fehlt.");
    }

    const { data: document, error: documentError } = await supabase
        .from("documents")
        .select("id, file_path, source, generated_by_system")
        .eq("id", documentId)
        .eq("company_id", companyId)
        .eq("vehicle_id", vehicleId)
        .single();

    if (documentError || !document) {
        throw new Error(
            `Dokument konnte nicht geladen werden: ${
                documentError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    if (document.source !== "uploaded" || document.generated_by_system) {
        throw new Error(
            "Dieses Dokument wurde vom System erzeugt und kann hier nicht gelöscht werden.",
        );
    }

    if (document.file_path) {
        await supabase.storage.from("documents").remove([document.file_path]);
    }

    const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id)
        .eq("company_id", companyId)
        .eq("vehicle_id", vehicleId);

    if (deleteError) {
        throw new Error(
            `Dokument wurde aus dem Storage entfernt, aber der Datenbankeintrag konnte nicht entfernt werden: ${deleteError.message}`,
        );
    }

    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/vehicles/${vehicleId}?vehicleDocumentDeleted=1`);
}
