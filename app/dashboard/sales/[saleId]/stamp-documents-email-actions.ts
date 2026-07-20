"use server";

import { revalidatePath } from "next/cache";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import {
    normalizeEmailLanguage,
} from "@/lib/customers/email-languages";
import {
    EmailConfigurationError,
    sendEmailWithResend,
} from "@/lib/email/resend";
import {
    getAvailableStampDocuments,
    getStampDocumentType,
} from "@/lib/sales/stamp-documents";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SendStampDocumentsEmailState = {
    success: boolean;
    message: string;
};

const initialErrorMessage =
    "Dokumente zum Stempeln konnten nicht per E-Mail gesendet werden. Bitte versuche es erneut.";
const maxAttachmentBytes = 20 * 1024 * 1024;

type SupabaseRelation<T> = T | T[] | null;

type SaleEmailDocumentRow = {
    id: string;
    document_type: string;
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    status: "available" | "missing" | "needs_review";
};

type SaleEmailQueryRow = {
    id: string;
    buyer_customer_id: string;
    customers: SupabaseRelation<{
        id: string;
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        preferred_language: string | null;
        country: string | null;
    }>;
    vehicles: SupabaseRelation<{
        internal_number: string;
        manufacturer: string;
        model: string;
    }>;
    documents: SupabaseRelation<SaleEmailDocumentRow>;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getStringValues(formData: FormData, key: string): string[] {
    return formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
}

function getSingleRelation<T>(relation: SupabaseRelation<T>): T | null {
    if (!relation) return null;

    return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function getManyRelation<T>(relation: SupabaseRelation<T>): T[] {
    if (!relation) return [];

    return Array.isArray(relation) ? relation : [relation];
}

function toHtml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .split("\n\n")
        .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br />")}</p>`)
        .join("");
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendStampDocumentsEmailAction(
    _previousState: SendStampDocumentsEmailState,
    formData: FormData,
): Promise<SendStampDocumentsEmailState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();
    const saleId = getStringValue(formData, "sale_id");
    const recipientEmail = getStringValue(formData, "recipient_email");
    const subject = getStringValue(formData, "subject");
    const body = getStringValue(formData, "body");
    const selectedDocumentIds = new Set(getStringValues(formData, "document_ids"));
    const language = normalizeEmailLanguage(
        getStringValue(formData, "language"),
        "en",
    );

    if (!saleId) {
        return { success: false, message: "Verkaufsakte fehlt." };
    }

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
        return {
            success: false,
            message: "Bitte gib eine gültige Empfänger-E-Mail-Adresse ein.",
        };
    }

    if (!subject || !body) {
        return {
            success: false,
            message: "Bitte prüfe Betreff und E-Mail-Text.",
        };
    }

    if (selectedDocumentIds.size === 0) {
        return {
            success: false,
            message: "Bitte wähle mindestens ein vorhandenes Dokument aus.",
        };
    }

    const { data, error } = await supabase
        .from("sales")
        .select(
            `
            id,
            buyer_customer_id,
            customers:buyer_customer_id (
                id,
                type,
                company_name,
                first_name,
                last_name,
                email,
                preferred_language,
                country
            ),
            vehicles (
                internal_number,
                manufacturer,
                model
            ),
            documents (
                id,
                document_type,
                file_name,
                file_path,
                mime_type,
                file_size,
                status
            )
        `,
        )
        .eq("id", saleId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) {
        console.error("[stamp-doc-email] sale lookup failed", error);
        return { success: false, message: "Verkaufsakte konnte nicht geladen werden." };
    }

    const sale = data as unknown as SaleEmailQueryRow;
    const customer = getSingleRelation(sale.customers);
    const vehicle = getSingleRelation(sale.vehicles);

    if (!customer || !vehicle) {
        return {
            success: false,
            message: "Für diesen Verkauf fehlen Kunde oder Fahrzeug.",
        };
    }

    const availableStampDocuments = getAvailableStampDocuments(
        getManyRelation(sale.documents),
    ).filter((document) => selectedDocumentIds.has(document.id));

    if (availableStampDocuments.length === 0) {
        return {
            success: false,
            message: "Für diesen Verkauf sind noch keine Dokumente zum Stempeln vorhanden.",
        };
    }

    const attachments = [];
    let totalAttachmentBytes = 0;

    for (const document of availableStampDocuments) {
        if (!document.file_path) continue;
        if (!getStampDocumentType(document)) continue;

        const { data: fileData, error: downloadError } = await supabase.storage
            .from("documents")
            .download(document.file_path);

        if (downloadError || !fileData) {
            console.error("[stamp-doc-email] attachment download failed", {
                documentId: document.id,
                error: downloadError,
            });
            return {
                success: false,
                message: `Dokument "${document.file_name}" konnte nicht geladen werden.`,
            };
        }

        const content = Buffer.from(await fileData.arrayBuffer());
        totalAttachmentBytes += content.byteLength;

        if (totalAttachmentBytes > maxAttachmentBytes) {
            return {
                success: false,
                message:
                    "Die ausgewählten Anhänge sind zu groß für den E-Mail-Versand. Bitte wähle weniger Dokumente aus.",
            };
        }

        attachments.push({
            filename: document.file_name,
            content,
            contentType: document.mime_type ?? fileData.type ?? "application/pdf",
        });
    }

    if (attachments.length === 0) {
        return {
            success: false,
            message: "Es konnte kein gültiger Anhang geladen werden.",
        };
    }

    try {
        await sendEmailWithResend({
            to: recipientEmail,
            subject,
            text: body,
            html: toHtml(body),
            attachments,
        });
    } catch (sendError) {
        if (sendError instanceof EmailConfigurationError) {
            return { success: false, message: sendError.message };
        }

        console.error("[stamp-doc-email] delivery failed", sendError);
        return { success: false, message: initialErrorMessage };
    }

    await logActivity({
        action: `Dokumente zum Stempeln an ${recipientEmail} gesendet (${language}, ${availableStampDocuments
            .map((document) => document.label)
            .join(", ")})`,
        entityType: "sale",
        entityId: saleId,
    });

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/activities");

    return {
        success: true,
        message: `Dokumente zum Stempeln wurden an ${recipientEmail} gesendet.`,
    };
}
