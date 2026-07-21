import { DocumentNotFoundError } from "@/src/modules/documents/domain/errors/document-errors";
import type { DocumentRepository } from "@/src/modules/documents/application/ports/document-repository.port";
import type { GetDocumentDetailQuery } from "@/src/modules/documents/application/queries/get-document-detail.query";

export class GetDocumentDetailUseCase {
    constructor(private readonly documents: DocumentRepository) {}

    async execute(query: GetDocumentDetailQuery) {
        const document = await this.documents.findDetail(query);

        if (!document) {
            throw new DocumentNotFoundError();
        }

        return document;
    }
}
