export type DocumentLifecycleStatus =
    | "ACTIVE"
    | "REVIEW_REQUIRED"
    | "APPROVED"
    | "REJECTED"
    | "ARCHIVED"
    | "ERROR";

export type DocumentArchiveStatus = "ACTIVE" | "ARCHIVED";

export const documentStatusLabels: Record<DocumentLifecycleStatus, string> = {
    ACTIVE: "Aktiv",
    REVIEW_REQUIRED: "Zu prüfen",
    APPROVED: "Freigegeben",
    REJECTED: "Abgelehnt",
    ARCHIVED: "Archiviert",
    ERROR: "Fehlerhaft",
};

export const allowedDocumentStatusTransitions: ReadonlyMap<
    DocumentLifecycleStatus,
    readonly DocumentLifecycleStatus[]
> = new Map([
    ["ACTIVE", ["REVIEW_REQUIRED", "APPROVED", "ARCHIVED", "ERROR"]],
    ["REVIEW_REQUIRED", ["APPROVED", "REJECTED", "ARCHIVED", "ERROR"]],
    ["APPROVED", ["ARCHIVED", "REVIEW_REQUIRED"]],
    ["REJECTED", ["REVIEW_REQUIRED", "ARCHIVED"]],
    ["ERROR", ["REVIEW_REQUIRED", "ARCHIVED"]],
    ["ARCHIVED", []],
]);

export function mapLegacyDocumentStatus(status: string): DocumentLifecycleStatus {
    if (status === "available") return "ACTIVE";
    if (status === "needs_review" || status === "missing") return "REVIEW_REQUIRED";

    return documentStatusLabels[status as DocumentLifecycleStatus]
        ? (status as DocumentLifecycleStatus)
        : "ACTIVE";
}

export function mapLifecycleStatusToLegacyStatus(
    status: DocumentLifecycleStatus,
): "available" | "missing" | "needs_review" {
    if (status === "REVIEW_REQUIRED" || status === "REJECTED" || status === "ERROR") {
        return "needs_review";
    }

    return "available";
}
