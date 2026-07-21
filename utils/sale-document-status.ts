export type SaleDocumentStatus = "complete" | "open";

export function getSaleDocumentStatus({
    missingRequiredDocuments,
    missingRequiredData,
}: {
    missingRequiredDocuments: number;
    missingRequiredData: number;
}): SaleDocumentStatus {
    return missingRequiredDocuments === 0 && missingRequiredData === 0
        ? "complete"
        : "open";
}

export function getSaleDocumentStatusLabel(status: SaleDocumentStatus): string {
    return status === "complete" ? "Dokumente vollständig" : "Dokumente offen";
}
