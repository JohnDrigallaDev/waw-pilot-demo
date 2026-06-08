"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreatePurchaseCaseState = {
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

function generatePurchaseNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6);

    return `AK-${year}-${timestamp}`;
}

export async function createPurchaseCaseAction(
    _previousState: CreatePurchaseCaseState,
    formData: FormData,
): Promise<CreatePurchaseCaseState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const vehicleId = getStringValue(formData, "vehicle_id");
    const sellerCustomerId = getStringValue(formData, "seller_customer_id");
    const purchaseDate = getStringValue(formData, "purchase_date");
    const netAmount = getNumberValue(formData, "net_amount");
    const vatRate = getNumberValue(formData, "vat_rate") ?? 19;
    const paymentStatus = getStringValue(formData, "payment_status") ?? "open";
    const notes = getStringValue(formData, "notes");

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
    const purchaseNumber = generatePurchaseNumber();

    const { data: purchaseCase, error: purchaseError } = await supabase
        .from("purchase_cases")
        .insert({
            company_id: companyId,
            vehicle_id: vehicleId,
            seller_customer_id: sellerCustomerId,
            purchase_number: purchaseNumber,
            purchase_date: purchaseDate,
            net_amount: netAmount,
            vat_rate: vatRate,
            vat_amount: vatAmount,
            gross_amount: grossAmount,
            status: "active",
            payment_status: paymentStatus,
            document_check_status: "missing",
            notes,
        })
        .select("id")
        .single();

    if (purchaseError || !purchaseCase) {
        return {
            success: false,
            message: `Ankaufsakte konnte nicht gespeichert werden: ${
                purchaseError?.message ?? "Keine ID erhalten"
            }`,
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
            message: `Ankaufsakte wurde gespeichert, aber Fahrzeug konnte nicht aktualisiert werden: ${vehicleUpdateError.message}`,
        };
    }

    redirect(`/dashboard/ankauf/${purchaseCase.id}`);
}