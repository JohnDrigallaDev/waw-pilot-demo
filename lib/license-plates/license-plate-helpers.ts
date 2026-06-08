import type {
    LicensePlateStatus,
    LicensePlateType,
} from "@/lib/license-plates/license-plate-queries";

export function getLicensePlateTypeLabel(type: LicensePlateType): string {
    const labels: Record<LicensePlateType, string> = {
        export: "Exportkennzeichen",
        customs: "Zollkennzeichen",
        short_term: "Kurzzeitkennzeichen",
    };

    return labels[type];
}

export function getLicensePlateStatusLabel(status: LicensePlateStatus): string {
    const labels: Record<LicensePlateStatus, string> = {
        open: "Offen",
        requested: "Beantragt",
        completed: "Abgeschlossen",
        cancelled: "Storniert",
    };

    return labels[status];
}

export function getLicensePlateStatusTone(
    status: LicensePlateStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (status === "completed") return "success";
    if (status === "requested") return "info";
    if (status === "cancelled") return "danger";

    return "warning";
}

export function getLicensePlateTypeTone(
    type: LicensePlateType,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (type === "short_term") return "info";
    if (type === "export") return "success";
    if (type === "customs") return "warning";

    return "neutral";
}