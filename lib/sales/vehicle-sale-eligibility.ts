import type { VehicleStatus } from "@/lib/vehicles/vehicle-queries";

export type VehicleSaleEligibilityResult = {
    eligible: boolean;
    reason: string | null;
};

const sellableVehicleStatuses: ReadonlySet<VehicleStatus> = new Set([
    "in_stock",
    "reserved",
]);

export function evaluateVehicleSaleEligibility(
    status: VehicleStatus | string | null | undefined,
): VehicleSaleEligibilityResult {
    if (!status) {
        return {
            eligible: false,
            reason: "Der Fahrzeugstatus fehlt und muss vor dem Verkauf geprüft werden.",
        };
    }

    if (sellableVehicleStatuses.has(status as VehicleStatus)) {
        return { eligible: true, reason: null };
    }

    if (status === "sold") {
        return {
            eligible: false,
            reason: "Dieses Fahrzeug wurde bereits verkauft und kann nicht erneut verkauft werden.",
        };
    }

    return {
        eligible: false,
        reason: "Dieses Fahrzeug ist im aktuellen Status nicht verkaufsfähig.",
    };
}

export function normalizeVinForSale(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, "");
}
