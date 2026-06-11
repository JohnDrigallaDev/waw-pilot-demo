"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logActivity } from "@/lib/activity/activity-log";
import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateVehicleState = {
    success: boolean;
    message: string;
};

type VehicleStatus = "in_stock" | "reserved" | "sold";

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

function getStatusValue(formData: FormData): VehicleStatus {
    const value = getStringValue(formData, "status");

    if (value === "in_stock" || value === "reserved" || value === "sold") {
        return value;
    }

    return "in_stock";
}

function getVehicleActivityName(vehicle: {
    internal_number: string | null;
    manufacturer: string | null;
    model: string | null;
}): string {
    const name = [vehicle.internal_number, vehicle.manufacturer, vehicle.model]
        .filter(Boolean)
        .join(" · ")
        .trim();

    return name || "unbekanntes Fahrzeug";
}

export async function updateVehicleAction(
    vehicleId: string,
    _previousState: UpdateVehicleState,
    formData: FormData,
): Promise<UpdateVehicleState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const internalNumber = getStringValue(formData, "internal_number");
    const manufacturer = getStringValue(formData, "manufacturer");
    const model = getStringValue(formData, "model");
    const vehicleType = getStringValue(formData, "vehicle_type");
    const constructionYear = getNumberValue(formData, "construction_year");
    const firstRegistration = getStringValue(formData, "first_registration");
    const vin = getStringValue(formData, "vin");
    const licensePlate = getStringValue(formData, "license_plate");
    const purchasePriceNet = getNumberValue(formData, "purchase_price_net");
    const salePriceNet = getNumberValue(formData, "sale_price_net");
    const additionalCostsNet = getNumberValue(formData, "additional_costs_net") ?? 0;
    const status = getStatusValue(formData);
    const notes = getStringValue(formData, "notes");

    if (!vehicleId) {
        return {
            success: false,
            message: "Fahrzeug-ID fehlt.",
        };
    }

    if (!internalNumber) {
        return {
            success: false,
            message: "Bitte gib eine interne Nummer ein.",
        };
    }

    if (!manufacturer) {
        return {
            success: false,
            message: "Bitte gib einen Hersteller ein.",
        };
    }

    if (!model) {
        return {
            success: false,
            message: "Bitte gib ein Modell ein.",
        };
    }

    if (!vehicleType) {
        return {
            success: false,
            message: "Bitte gib einen Fahrzeugtyp ein.",
        };
    }

    if (!vin) {
        return {
            success: false,
            message: "Bitte gib eine Fahrgestellnummer ein.",
        };
    }

    if (purchasePriceNet === null || purchasePriceNet < 0) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Einkaufspreis netto ein.",
        };
    }

    if (salePriceNet !== null && salePriceNet < 0) {
        return {
            success: false,
            message: "Bitte gib einen gültigen Verkaufspreis netto ein.",
        };
    }

    if (additionalCostsNet < 0) {
        return {
            success: false,
            message: "Bitte gib gültige Nebenkosten ein.",
        };
    }

    const { data: existingVehicle, error: loadError } = await supabase
        .from("vehicles")
        .select("id, internal_number, manufacturer, model")
        .eq("id", vehicleId)
        .eq("company_id", companyId)
        .single();

    if (loadError || !existingVehicle) {
        return {
            success: false,
            message: `Fahrzeug konnte nicht geladen werden: ${
                loadError?.message ?? "Nicht gefunden"
            }`,
        };
    }

    const { error: updateError } = await supabase
        .from("vehicles")
        .update({
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
            status,
            notes,
        })
        .eq("id", vehicleId)
        .eq("company_id", companyId);

    if (updateError) {
        return {
            success: false,
            message: `Fahrzeug konnte nicht aktualisiert werden: ${updateError.message}`,
        };
    }

    await logActivity({
        action: `Fahrzeug ${getVehicleActivityName(existingVehicle)} bearbeitet`,
        entityType: "vehicle",
        entityId: vehicleId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/vehicles");
    revalidatePath("/dashboard/vehicles/bestandsliste");
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
    revalidatePath("/dashboard/activities");

    redirect(`/dashboard/vehicles/${vehicleId}`);
}