import type {
    PurchaseCaseDocumentStatus,
    PurchaseCasePaymentStatus,
    PurchaseCaseStatus,
} from "@/lib/purchases/purchase-queries";

export function getPurchaseStatusLabel(status: PurchaseCaseStatus): string {
    const labels: Record<PurchaseCaseStatus, string> = {
        draft: "Entwurf",
        active: "Aktiv",
        completed: "Abgeschlossen",
        cancelled: "Storniert",
    };

    return labels[status];
}

export function getPurchaseStatusTone(
    status: PurchaseCaseStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (status === "completed") return "success";
    if (status === "active") return "info";
    if (status === "cancelled") return "danger";

    return "warning";
}

export function getPurchasePaymentStatusLabel(
    status: PurchaseCasePaymentStatus,
): string {
    const labels: Record<PurchaseCasePaymentStatus, string> = {
        open: "Offen",
        partial: "Teilweise bezahlt",
        paid: "Bezahlt",
    };

    return labels[status];
}

export function getPurchasePaymentStatusTone(
    status: PurchaseCasePaymentStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (status === "paid") return "success";
    if (status === "partial") return "warning";

    return "danger";
}

export function getPurchaseDocumentStatusLabel(
    status: PurchaseCaseDocumentStatus,
): string {
    const labels: Record<PurchaseCaseDocumentStatus, string> = {
        complete: "Vollständig",
        missing: "Fehlt",
        needs_review: "Prüfen",
    };

    return labels[status];
}

export function getPurchaseDocumentStatusTone(
    status: PurchaseCaseDocumentStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (status === "complete") return "success";
    if (status === "needs_review") return "warning";

    return "danger";
}