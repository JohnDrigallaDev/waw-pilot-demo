import type {
    DatevStatus,
    DocumentCheckStatus,
    PaymentStatus,
    SaleRow,
    SaleStatus,
    SaleType,
} from "@/lib/sales/sale-queries";

export function getSaleProfitNet(sale: SaleRow): number {
    return sale.net_amount - sale.purchase_price_net - sale.additional_costs_net;
}

export function getSaleTypeLabel(type: SaleType): string {
    const labels: Record<SaleType, string> = {
        inland: "Inland",
        eu: "EU-Verkauf",
        export_third_country: "Drittlandexport",
    };

    return labels[type];
}

export function getSaleTypeTone(
    type: SaleType,
): "success" | "warning" | "info" | "neutral" {
    if (type === "inland") return "neutral";
    if (type === "eu") return "info";
    if (type === "export_third_country") return "warning";

    return "neutral";
}

export function getSaleStatusLabel(status: SaleStatus): string {
    const labels: Record<SaleStatus, string> = {
        draft: "Entwurf",
        active: "Aktiv",
        completed: "Abgeschlossen",
        cancelled: "Storniert",
    };

    return labels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
        open: "Offen",
        partial: "Teilbezahlt",
        paid: "Bezahlt",
    };

    return labels[status];
}

export function getDocumentCheckLabel(status: DocumentCheckStatus): string {
    const labels: Record<DocumentCheckStatus, string> = {
        complete: "Vollständig",
        missing: "Fehlt",
        warning: "Prüfen",
    };

    return labels[status];
}

export function getDatevStatusLabel(status: DatevStatus): string {
    const labels: Record<DatevStatus, string> = {
        not_sent: "Nicht gesendet",
        sent: "Gesendet",
    };

    return labels[status];
}

export function getSaleStatusTone(
    status: SaleStatus,
): "success" | "warning" | "danger" | "info" | "neutral" {
    if (status === "completed") return "success";
    if (status === "active") return "info";
    if (status === "draft") return "warning";
    if (status === "cancelled") return "danger";

    return "neutral";
}

export function getPaymentStatusTone(
    status: PaymentStatus,
): "success" | "warning" | "danger" {
    if (status === "paid") return "success";
    if (status === "partial") return "warning";

    return "danger";
}

export function getDocumentCheckTone(
    status: DocumentCheckStatus,
): "success" | "warning" | "danger" {
    if (status === "complete") return "success";
    if (status === "warning") return "warning";

    return "danger";
}

export function getDatevStatusTone(status: DatevStatus): "success" | "warning" {
    if (status === "sent") return "success";

    return "warning";
}