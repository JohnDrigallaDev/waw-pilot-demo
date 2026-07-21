import type {
    DocumentArchiveStatus,
    DocumentLifecycleStatus,
} from "@/src/modules/documents/domain/constants/document-status";
import type {
    DocumentRelationType,
    DocumentTypeCode,
} from "@/src/modules/documents/domain/constants/document-types";

export type DocumentEntity = {
    id: string;
    companyId: string;
    documentReference: string;
    documentType: DocumentTypeCode;
    title: string;
    description: string | null;
    status: DocumentLifecycleStatus;
    archiveStatus: DocumentArchiveStatus;
    activeVersionId: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    archivedAt: string | null;
    archivedBy: string | null;
    archiveReason: string | null;
    metadata: Record<string, unknown> | null;
};

export type DocumentVersionEntity = {
    id: string;
    companyId: string;
    documentId: string;
    versionNumber: number;
    originalFileName: string;
    storedFileName: string;
    storageBucket: string;
    storagePath: string;
    mimeType: string;
    fileSizeBytes: number;
    checksum: string | null;
    uploadedAt: string;
    uploadedBy: string | null;
    isActive: boolean;
    replacedVersionId: string | null;
    replacementReason: string | null;
    metadata: Record<string, unknown> | null;
};

export type DocumentRelationEntity = {
    id: string;
    companyId: string;
    documentId: string;
    relationType: DocumentRelationType;
    relationId: string;
    createdAt: string;
    createdBy: string | null;
    metadata: Record<string, unknown> | null;
};
