import type {
    DocumentRelationEntity,
    DocumentVersionEntity,
} from "@/src/modules/documents/domain/entities/document";

export type DocumentListItemDto = {
    id: string;
    documentReference: string;
    documentType: string;
    documentTypeLabel: string;
    title: string;
    status: string;
    archiveStatus: string;
    source: "generated" | "uploaded";
    fileName: string;
    mimeType: string | null;
    fileSizeBytes: number | null;
    activeVersionNumber: number | null;
    createdAt: string;
    createdBy: string | null;
    relationLabels: string[];
    customerName: string | null;
    customerId: string | null;
    vehicleLabel: string | null;
    invoiceNumber: string | null;
    invoiceId: string | null;
    saleId: string | null;
    vehicleId: string | null;
    purchaseId: string | null;
    licensePlateCaseId: string | null;
    reviewHref: string | null;
    hasActiveFile: boolean;
};

export type DocumentDetailDto = DocumentListItemDto & {
    description: string | null;
    versions: DocumentVersionEntity[];
    relations: DocumentRelationEntity[];
    updatedAt: string;
    archivedAt: string | null;
    archiveReason: string | null;
};

export type DocumentSearchResultDto = {
    documents: DocumentListItemDto[];
    totalCount: number;
};
