import type { DocumentListItemDto } from "@/src/modules/documents/application/dto/document.dto";
import type { DocumentRow } from "@/lib/documents/document-queries";

function mapStatus(status: string): DocumentRow["status"] {
    if (status === "REVIEW_REQUIRED" || status === "REJECTED" || status === "ERROR") {
        return "needs_review";
    }

    return "available";
}

export function mapDocumentListItemToLegacyRow(
    document: DocumentListItemDto,
): DocumentRow {
    return {
        id: document.id,
        document_type: document.documentType,
        source: document.source,
        status: mapStatus(document.status),
        file_name: document.fileName,
        file_path: document.hasActiveFile ? document.id : null,
        mime_type: document.mimeType,
        file_size: document.fileSizeBytes,
        customer_id: null,
        vehicle_id: document.vehicleId,
        sale_id: document.saleId,
        invoice_id: null,
        generated_by_system: document.source === "generated",
        created_at: document.createdAt,
        customer_name: document.customerName,
        vehicle_internal_number: document.vehicleLabel?.split(" · ")[0] ?? null,
        vehicle_name: document.vehicleLabel,
        invoice_number: document.invoiceNumber,
        review_href: document.reviewHref,
    };
}
