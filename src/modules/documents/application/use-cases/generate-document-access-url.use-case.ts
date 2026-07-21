import type { GenerateDocumentAccessUrlCommand } from "@/src/modules/documents/application/commands/generate-document-access-url.command";
import type { DocumentRepository } from "@/src/modules/documents/application/ports/document-repository.port";
import type { DocumentStoragePort } from "@/src/modules/documents/application/ports/document-storage.port";
import { ActiveVersionMissingError } from "@/src/modules/documents/domain/errors/document-errors";

export class GenerateDocumentAccessUrlUseCase {
    constructor(
        private readonly documents: DocumentRepository,
        private readonly storage: DocumentStoragePort,
    ) {}

    async execute(command: GenerateDocumentAccessUrlCommand) {
        const file = await this.documents.findActiveFile(command);

        if (!file) {
            throw new ActiveVersionMissingError();
        }

        const url = await this.storage.createSignedReadUrl({
            bucket: file.storageBucket,
            path: file.storagePath,
            expiresInSeconds: command.expiresInSeconds ?? 300,
        });

        return {
            ...file,
            signedUrl: url,
        };
    }
}
