"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getPaymentMethodLabel(paymentMethod: string): string {
    if (paymentMethod === "cash") return "Bar";
    if (paymentMethod === "bank") return "Bank";

    return paymentMethod;
}

export async function markPurchasePaidAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const purchaseId = getStringValue(formData, "purchase_id");
    const paymentMethod = getStringValue(formData, "payment_method") ?? "bank";

    if (!purchaseId) {
        throw new Error("Ankaufsakte fehlt.");
    }

    if (paymentMethod !== "bank" && paymentMethod !== "cash") {
        throw new Error("Ungültige Zahlungsart.");
    }

    const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_cases")
        .select(
            `
            id,
            vehicle_id,
            seller_customer_id,
            purchase_number,
            gross_amount,
            payment_status
        `,
        )
        .eq("id", purchaseId)
        .eq("company_id", companyId)
        .single();

    if (purchaseError || !purchaseData) {
        throw new Error(
            `Ankaufsakte konnte nicht geladen werden: ${
                purchaseError?.message ?? "Nicht gefunden"
            }`,
        );
    }

    if (purchaseData.payment_status === "paid") {
        redirect(`/dashboard/ankauf/${purchaseId}`);
    }

    const purchaseNumber = purchaseData.purchase_number ?? purchaseId;
    const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);

    const { error: purchaseUpdateError } = await supabase
        .from("purchase_cases")
        .update({
            payment_status: "paid",
            status: "completed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId)
        .eq("company_id", companyId);

    if (purchaseUpdateError) {
        throw new Error(
            `Ankaufsakte konnte nicht als bezahlt markiert werden: ${purchaseUpdateError.message}`,
        );
    }

    await logActivity({
        action: `Ankauf ${purchaseNumber} als bezahlt markiert`,
        entityType: "purchase",
        entityId: purchaseId,
    });

    const { data: existingCashbookEntry, error: cashbookCheckError } =
        await supabase
            .from("cashbook_entries")
            .select("id")
            .eq("company_id", companyId)
            .eq("purchase_case_id", purchaseId)
            .maybeSingle();

    if (cashbookCheckError) {
        throw new Error(
            `Kassenbuch konnte nicht geprüft werden: ${cashbookCheckError.message}`,
        );
    }

    if (!existingCashbookEntry) {
        const { data: cashbookEntry, error: cashbookInsertError } = await supabase
            .from("cashbook_entries")
            .insert({
                company_id: companyId,
                entry_type: "expense",
                category: "vehicle_purchase",
                payment_method: paymentMethod,
                amount: Number(purchaseData.gross_amount),
                booking_date: new Date().toISOString().slice(0, 10),
                description: `Zahlung Ankauf ${purchaseNumber}`,
                customer_id: purchaseData.seller_customer_id,
                vehicle_id: purchaseData.vehicle_id,
                sale_id: null,
                invoice_id: null,
                purchase_case_id: purchaseId,
                document_id: null,
            })
            .select("id")
            .single();

        if (cashbookInsertError || !cashbookEntry) {
            throw new Error(
                `Kassenbuch-Eintrag konnte nicht erstellt werden: ${
                    cashbookInsertError?.message ?? "Keine Kassenbuch-ID erhalten"
                }`,
            );
        }

        await logActivity({
            action: `Kassenbuch-Eintrag für Ankauf ${purchaseNumber} erstellt (${paymentMethodLabel})`,
            entityType: "cashbook",
            entityId: cashbookEntry.id as string,
        });
    }

    revalidatePath(`/dashboard/ankauf/${purchaseId}`);
    revalidatePath("/dashboard/ankauf");
    revalidatePath("/dashboard/cashbook");
    revalidatePath("/dashboard/checks");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/activities");

    redirect(`/dashboard/ankauf/${purchaseId}`);
}