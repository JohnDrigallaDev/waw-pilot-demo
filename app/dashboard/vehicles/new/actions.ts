"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { logActivity } from "@/lib/activity/activity-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
    getDuplicateInternalNumberMessage,
    getDuplicateVinMessage,
    translateVehicleDatabaseError,
} from "@/lib/vehicles/vehicle-save-errors";

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

function getVehicleActivityName({
                                    internalNumber,
                                    manufacturer,
                                    model,
                                }: {
    internalNumber: string;
    manufacturer: string;
    model: string;
}): string {
    return [internalNumber, manufacturer, model].filter(Boolean).join(" · ");
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

    const vehicleActivityName = getVehicleActivityName({
        internalNumber,
        manufacturer,
        model,
    });

    const { data: duplicateVinVehicle, error: duplicateVinError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("company_id", companyId)
        .eq("vin", vin)
        .limit(1);

    if (duplicateVinError) {
        console.error("VIN duplicate check failed", duplicateVinError);
    }

    if (duplicateVinVehicle && duplicateVinVehicle.length > 0) {
        return {
            success: false,
            message: getDuplicateVinMessage(),
        };
    }

    const {
        data: duplicateInternalNumberVehicle,
        error: duplicateInternalNumberError,
    } = await supabase
        .from("vehicles")
        .select("id")
        .eq("company_id", companyId)
        .eq("internal_number", internalNumber)
        .limit(1);

    if (duplicateInternalNumberError) {
        console.error(
            "Internal number duplicate check failed",
            duplicateInternalNumberError,
        );
    }

    if (
        duplicateInternalNumberVehicle &&
        duplicateInternalNumberVehicle.length > 0
    ) {
        return {
            success: false,
            message: getDuplicateInternalNumberMessage(),
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

    if (vehicleError || !vehicle) {
        if (vehicleError) {
            console.error("Vehicle insert failed", vehicleError);
        }

        return {
            success: false,
            message: vehicleError
                ? translateVehicleDatabaseError(vehicleError)
                : "Fahrzeug konnte nicht gespeichert werden. Bitte versuche es erneut.",
        };
    }

    const vehicleId = vehicle.id as string;

    await logActivity({
        action: `Fahrzeug ${vehicleActivityName} angelegt`,
        entityType: "vehicle",
        entityId: vehicleId,
    });

    if (sellerCustomerId) {
        const { data: purchase, error: purchaseError } = await supabase
            .from("purchases")
            .insert({
                company_id: companyId,
                vehicle_id: vehicleId,
                seller_customer_id: sellerCustomerId,
                purchase_date: purchaseDate ?? new Date().toISOString().slice(0, 10),
                purchase_price_net: purchasePriceNet,
                additional_costs_net: additionalCostsNet,
                notes,
            })
            .select("id")
            .single();

        if (purchaseError || !purchase) {
            return {
                success: false,
                message: `Fahrzeug wurde gespeichert, aber der Ankauf konnte nicht gespeichert werden: ${
                    purchaseError?.message ?? "Keine Ankauf-ID erhalten"
                }`,
            };
        }

        await logActivity({
            action: `Ankauf für Fahrzeug ${vehicleActivityName} automatisch angelegt`,
            entityType: "purchase",
            entityId: purchase.id as string,
        });
    }

    redirect("/dashboard/vehicles");
}
