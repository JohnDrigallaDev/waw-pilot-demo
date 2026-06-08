"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type UpdatePurchaseCaseState = {
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

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

export async function updatePurchaseCaseAction(
    _previousState: UpdatePurchaseCaseState,
    formData: FormData,
): Promise<UpdatePurchaseCaseState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const purchaseId = getStringValue(formData, "purchase_id");
    const vehicleId = getStringValue(formData, "vehicle_id");
    const sellerCustomerId = getStringValue(formData, "seller_customer_id");
    const purchaseDate = getStringValue(formData, "purchase_date");
    const netAmount = getNumberValue(formData, "net_amount");
    const vatRate = getNumberValue(formData, "vat_rate") ?? 19;
    const paymentStatus = getStringValue(formData, "payment_status") ?? "open";
    const notes = getStringValue(formData, "notes");

    if (!purchaseId) {
        return {
            success: false,
            message: "Ankaufsakte fehlt.",
        };
    }

    if (!vehicleId) {
        return {
            success: false,
            message: "Bitte wähle ein Fahrzeug aus.",
        };
    }

    if (!sellerCustomerId) {
        return {
            success: false,
            message: "Bitte wähle einen Verkäufer aus.",
        };
    }

    if (!purchaseDate) {
        return {
            success: false,
            message: "Bitte wähle ein Ankaufsdatum aus.",
        };
    }

    if (netAmount === null || netAmount <= 0) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Einkaufspreis netto ein.",
        };
    }

    if (
        paymentStatus !== "open" &&
        paymentStatus !== "partial" &&
        paymentStatus !== "paid"
    ) {
        return {
            success: false,
            message: "Bitte wähle einen gültigen Zahlungsstatus aus.",
        };
    }

    const vatAmount = roundMoney(netAmount * (vatRate / 100));
    const grossAmount = roundMoney(netAmount + vatAmount);

    const { error: purchaseUpdateError } = await supabase
        .from("purchase_cases")
        .update({
            vehicle_id: vehicleId,
            seller_customer_id: sellerCustomerId,
            purchase_date: purchaseDate,
            net_amount: netAmount,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            gross_amount: grossAmount,
            payment_status: paymentStatus,
            status: paymentStatus === "paid" ? "completed" : "active",
            notes,
            updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId)
        .eq("company_id", companyId);

    if (purchaseUpdateError) {
        return {
            success: false,
            message: `Ankaufsakte konnte nicht aktualisiert werden: ${purchaseUpdateError.message}`,
        };
    }

    const { error: vehicleUpdateError } = await supabase
        .from("vehicles")
        .update({
            seller_customer_id: sellerCustomerId,
            purchase_price_net: netAmount,
            status: "in_stock",
        })
        .eq("id", vehicleId)
        .eq("company_id", companyId);

    if (vehicleUpdateError) {
        return {
            success: false,
            message: `Ankaufsakte wurde aktualisiert, aber Fahrzeug konnte nicht aktualisiert werden: ${vehicleUpdateError.message}`,
        };
    }

    revalidatePath(`/dashboard/ankauf/${purchaseId}`);
    revalidatePath("/dashboard/ankauf");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/checks");

    redirect(`/dashboard/ankauf/${purchaseId}`);
}