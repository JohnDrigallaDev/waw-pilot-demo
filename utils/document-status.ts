import type { DocumentStatus } from "@/lib/documents/document-queries";

export type DocumentStatusTone = "success" | "warning" | "danger";

const documentStatusLabels: Record<DocumentStatus, string> = {
    available: "Verfügbar",
    missing: "Fehlt",
    needs_review: "Prüfen",
};

export function isMissing(status: DocumentStatus | string | null | undefined): boolean {
    return status === "missing";
}

export function isPending(status: DocumentStatus | string | null | undefined): boolean {
    return status === "needs_review" || status === "pending";
}

export function isApproved(status: DocumentStatus | string | null | undefined): boolean {
    return status === "available" || status === "approved";
}

export function getBadge(status: DocumentStatus) {
    return {
        label: getDocumentStatusLabel(status),
        tone: getDocumentStatusTone(status),
    };
}

export function countMissing<T>(documents: T[], getStatus: (document: T) => DocumentStatus | string | null | undefined): number {
    return documents.filter((document) => isMissing(getStatus(document))).length;
}

export function getDocumentStatusLabel(status: DocumentStatus): string {
    return documentStatusLabels[status];
}

export function getDocumentStatusTone(status: DocumentStatus): DocumentStatusTone {
    if (status === "available") return "success";
    if (status === "needs_review") return "warning";

    return "danger";
}
