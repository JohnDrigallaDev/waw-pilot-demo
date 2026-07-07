"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import {
    getDocumentUploadFailedMessage,
    getUnsupportedDocumentTypeMessage,
    isAllowedDocumentFile,
} from "@/lib/documents/upload-validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateCashbookEntryState = {
    success: boolean;
    message: string;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getNumberValue(formData: FormData, key: string): number | null {
    const value = getStringValue(formData, key);

    if (!value) return null;

    const normalizedValue = value.replace(",", ".");
    const numberValue = Number(normalizedValue);

    return Number.isFinite(numberValue) ? numberValue : null;
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

function getEntryTypeLabel(entryType: string): string {
    if (entryType === "income") return "Einnahme";
    if (entryType === "expense") return "Ausgabe";

    return entryType;
}

function getPaymentMethodLabel(paymentMethod: string): string {
    if (paymentMethod === "cash") return "Bar";
    if (paymentMethod === "bank") return "Bank";

    return paymentMethod;
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        vehicle_sale: "Fahrzeugverkauf",
        vehicle_purchase: "Fahrzeugankauf",
        repair: "Reparatur / Werkstatt",
        fuel: "Kraftstoff",
        registration: "Zulassung / Kennzeichen",
        insurance: "Versicherung",
        tax: "Steuern / Gebühren",
        office: "Büro / Verwaltung",
        other: "Sonstiges",
    };

    return labels[category] ?? category;
}

async function createCashbookReceiptDocument({
                                                 companyId,
                                                 file,
                                                 description,
                                             }: {
    companyId: string;
    file: File;
    description: string;
}): Promise<string> {
    const supabase = createServerSupabaseClient();

    const originalFileName = sanitizeFileName(file.name);
    const fileExtension = getFileExtension(originalFileName);
    const timestamp = Date.now();

    const fileName = `kassenbuch-beleg-${timestamp}${fileExtension}`;
    const filePath = `cashbook/manual/${fileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, fileBuffer, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
        });

    if (uploadError) {
        console.error("[upload] cashbook receipt storage upload failed", uploadError);
        throw new Error(getDocumentUploadFailedMessage(uploadError));
    }

    const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
            company_id: companyId,
            document_type: "cashbook_receipt",
            source: "uploaded",
            status: "available",
            file_name: `Kassenbuch-Beleg - ${description} - ${originalFileName}`,
            file_path: filePath,
            mime_type: file.type || null,
            file_size: file.size,
            customer_id: null,
            vehicle_id: null,
            sale_id: null,
            invoice_id: null,
            generated_by_system: false,
        })
        .select("id")
        .single();

    if (documentError || !documentData) {
        await supabase.storage.from("documents").remove([filePath]);
        console.error("[upload] cashbook receipt document insert failed", documentError);

        throw new Error(
            "Dokument konnte nicht gespeichert werden. Bitte versuche es erneut.",
        );
    }

    return documentData.id as string;
}

export async function createCashbookEntryAction(
    _previousState: CreateCashbookEntryState,
    formData: FormData,
): Promise<CreateCashbookEntryState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const entryType = getStringValue(formData, "entry_type");
    const category = getStringValue(formData, "category");
    const paymentMethod = getStringValue(formData, "payment_method");
    const amount = getNumberValue(formData, "amount");
    const bookingDate = getStringValue(formData, "booking_date");
    const description = getStringValue(formData, "description");
    const fileValue = formData.get("receipt_file");

    if (entryType !== "income" && entryType !== "expense") {
        return {
            success: false,
            message: "Bitte wähle Einnahme oder Ausgabe aus.",
        };
    }

    if (!category) {
        return {
            success: false,
            message: "Bitte wähle eine Kategorie aus.",
        };
    }

    if (paymentMethod !== "cash" && paymentMethod !== "bank") {
        return {
            success: false,
            message: "Bitte wähle Bar oder Bank aus.",
        };
    }

    if (amount === null || amount <= 0) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Betrag ein.",
        };
    }

    if (!bookingDate) {
        return {
            success: false,
            message: "Bitte wähle ein Buchungsdatum aus.",
        };
    }

    if (!description) {
        return {
            success: false,
            message: "Bitte gib eine Beschreibung ein.",
        };
    }

    let documentId: string | null = null;

    try {
        if (fileValue instanceof File && fileValue.size > 0) {
            if (!isAllowedDocumentFile(fileValue)) {
                return {
                    success: false,
                    message: getUnsupportedDocumentTypeMessage(),
                };
            }

            documentId = await createCashbookReceiptDocument({
                companyId,
                file: fileValue,
                description,
            });

            await logActivity({
                action: `Kassenbuch-Beleg zu "${description}" hochgeladen`,
                entityType: "document",
                entityId: documentId,
            });
        }

        const { data: cashbookEntry, error } = await supabase
            .from("cashbook_entries")
            .insert({
                company_id: companyId,
                entry_type: entryType,
                category,
                payment_method: paymentMethod,
                amount,
                booking_date: bookingDate,
                description,

                customer_id: null,
                vehicle_id: null,
                sale_id: null,
                invoice_id: null,
                document_id: documentId,
            })
            .select("id")
            .single();

        if (error || !cashbookEntry) {
            return {
                success: false,
                message: `Buchung konnte nicht gespeichert werden: ${
                    error?.message ?? "Keine Kassenbuch-ID erhalten"
                }`,
            };
        }

        const entryTypeLabel = getEntryTypeLabel(entryType);
        const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);
        const categoryLabel = getCategoryLabel(category);

        await logActivity({
            action: `${entryTypeLabel} im Kassenbuch erfasst: ${description} (${paymentMethodLabel}, ${categoryLabel})`,
            entityType: "cashbook",
            entityId: cashbookEntry.id as string,
        });
    } catch (error) {
        return {
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Buchung konnte nicht gespeichert werden.",
        };
    }

    redirect("/dashboard/cashbook");
}
