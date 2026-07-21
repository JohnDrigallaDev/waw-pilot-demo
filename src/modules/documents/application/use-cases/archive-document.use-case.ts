import type { ArchiveDocumentCommand } from "@/src/modules/documents/application/commands/archive-document.command";
import type { DocumentAuditLogPort } from "@/src/modules/documents/application/ports/document-audit-log.port";
import type { DocumentRepository } from "@/src/modules/documents/application/ports/document-repository.port";
import { DocumentLifecyclePolicy } from "@/src/modules/documents/domain/policies/document-lifecycle-policy";

export class ArchiveDocumentUseCase {
    private readonly lifecyclePolicy = new DocumentLifecyclePolicy();

    constructor(
        private readonly documents: DocumentRepository,
        private readonly auditLog: DocumentAuditLogPort,
    ) {}

    async execute(command: ArchiveDocumentCommand) {
        const document = await this.documents.findDetail({
            companyId: command.companyId,
            documentId: command.documentId,
        });

        if (!document) {
            return;
        }

        this.lifecyclePolicy.assertArchiveAllowed(document.documentType, document.archiveStatus as never);
        await this.documents.archive(command);
        await this.auditLog.record({
            companyId: command.companyId,
            documentId: command.documentId,
            action: "ARCHIVED",
            previousValues: {
                archiveStatus: document.archiveStatus,
                status: document.status,
            },
            newValues: {
                archiveStatus: "ARCHIVED",
                reason: command.reason,
            },
            changedBy: command.archivedBy,
            reason: command.reason,
        });
    }
}
