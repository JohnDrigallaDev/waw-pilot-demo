"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateVehicleState = {
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

function getDateValue(formData: FormData, key: string): string | null {
    return getStringValue(formData, key);
}

export async function createVehicleAction(
    _previousState: CreateVehicleState,
    formData: FormData,
): Promise<CreateVehicleState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const internalNumber = getStringValue(formData, "internal_number");
    const manufacturer = getStringValue(formData, "manufacturer");
    const model = getStringValue(formData, "model");
    const vehicleType = getStringValue(formData, "vehicle_type");
    const vin = getStringValue(formData, "vin");

    const constructionYear = getNumberValue(formData, "construction_year");
    const firstRegistration = getDateValue(formData, "first_registration");
    const licensePlate = getStringValue(formData, "license_plate");

    const purchasePriceNet = getNumberValue(formData, "purchase_price_net");
    const salePriceNet = getNumberValue(formData, "sale_price_net");
    const additionalCostsNet = getNumberValue(formData, "additional_costs_net") ?? 0;

    const sellerCustomerId = getStringValue(formData, "seller_customer_id");
    const purchaseDate = getDateValue(formData, "purchase_date");
    const notes = getStringValue(formData, "notes");

    if (!internalNumber || !manufacturer || !model || !vehicleType || !vin) {
        return {
            success: false,
            message:
                "Bitte fülle interne Nummer, Hersteller, Modell, Fahrzeugtyp und VIN aus.",
        };
    }

    if (purchasePriceNet === null) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Einkaufspreis netto ein.",
        };
    }

    const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
            company_id: companyId,
            internal_number: internalNumber,
            manufacturer,
            model,
            vehicle_type: vehicleType,
            construction_year: constructionYear,
            first_registration: firstRegistration,
            vin,
            license_plate: licensePlate,
            purchase_price_net: purchasePriceNet,
            sale_price_net: salePriceNet,
            additional_costs_net: additionalCostsNet,
            status: "in_stock",
            seller_customer_id: sellerCustomerId || null,
            notes,
        })
        .select("id")
        .single();

    if (vehicleError) {
        return {
            success: false,
            message: `Fahrzeug konnte nicht gespeichert werden: ${vehicleError.message}`,
        };
    }

    if (sellerCustomerId) {
        const { error: purchaseError } = await supabase.from("purchases").insert({
            company_id: companyId,
            vehicle_id: vehicle.id,
            seller_customer_id: sellerCustomerId,
            purchase_date: purchaseDate ?? new Date().toISOString().slice(0, 10),
            purchase_price_net: purchasePriceNet,
            additional_costs_net: additionalCostsNet,
            notes,
        });

        if (purchaseError) {
            return {
                success: false,
                message: `Fahrzeug wurde gespeichert, aber der Ankauf konnte nicht gespeichert werden: ${purchaseError.message}`,
            };
        }
    }

    redirect("/dashboard/vehicles");
}