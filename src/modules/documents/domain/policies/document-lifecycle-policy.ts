import {
    allowedDocumentStatusTransitions,
    type DocumentArchiveStatus,
    type DocumentLifecycleStatus,
} from "@/src/modules/documents/domain/constants/document-status";
import { getDocumentTypeDefinition } from "@/src/modules/documents/domain/constants/document-types";
import {
    DocumentAlreadyArchivedError,
    DocumentReplacementNotAllowedError,
} from "@/src/modules/documents/domain/errors/document-errors";

export class DocumentLifecyclePolicy {
    canTransitionStatus(
        currentStatus: DocumentLifecycleStatus,
        nextStatus: DocumentLifecycleStatus,
    ): boolean {
        return allowedDocumentStatusTransitions.get(currentStatus)?.includes(nextStatus) ?? false;
    }

    assertReplacementAllowed(documentType: string, archiveStatus: DocumentArchiveStatus): void {
        if (archiveStatus === "ARCHIVED") {
            throw new DocumentAlreadyArchivedError();
        }

        if (!getDocumentTypeDefinition(documentType).replacementAllowed) {
            throw new DocumentReplacementNotAllowedError();
        }
    }

    assertArchiveAllowed(documentType: string, archiveStatus: DocumentArchiveStatus): void {
        if (archiveStatus === "ARCHIVED") {
            throw new DocumentAlreadyArchivedError();
        }

        if (!getDocumentTypeDefinition(documentType).archiveAllowed) {
            throw new DocumentReplacementNotAllowedError();
        }
    }
}
