import type {
    VehicleDocumentStatus,
    VehicleRow,
    VehicleStatus,
} from "@/lib/vehicles/vehicle-queries";

export function getVehicleDisplayName(vehicle: VehicleRow): string {
    return `${vehicle.manufacturer} ${vehicle.model}`;
}

export function getVehicleStatusLabel(status: VehicleStatus): string {
    const labels: Record<VehicleStatus, string> = {
        in_stock: "Im Bestand",
        reserved: "Reserviert",
        sold: "Verkauft",
    };

    return labels[status];
}

export function getVehicleDocumentStatusLabel(
    status: VehicleDocumentStatus,
): string {
    const labels: Record<VehicleDocumentStatus, string> = {
        complete: "Vollständig",
        partial: "Teilweise",
        missing: "Fehlt",
    };

    return labels[status];
}

export function getVehicleProfit(vehicle: VehicleRow): number | null {
    if (!vehicle.sale_price_net) return null;

    return (
        vehicle.sale_price_net -
        vehicle.purchase_price_net -
        (vehicle.additional_costs_net ?? 0)
    );
}

export function getVehicleStatusTone(
    status: VehicleStatus,
): "success" | "warning" | "info" | "neutral" {
    if (status === "sold") return "success";
    if (status === "reserved") return "warning";
    if (status === "in_stock") return "info";

    return "neutral";
}

export function getDocumentStatusTone(
    status: VehicleDocumentStatus,
): "success" | "warning" | "danger" {
    if (status === "complete") return "success";
    if (status === "partial") return "warning";

    return "danger";
}