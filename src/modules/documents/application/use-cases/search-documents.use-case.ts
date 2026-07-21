import type { DocumentRepository } from "@/src/modules/documents/application/ports/document-repository.port";
import type { SearchDocumentsQuery } from "@/src/modules/documents/application/queries/search-documents.query";

export class SearchDocumentsUseCase {
    constructor(private readonly documents: DocumentRepository) {}

    execute(query: SearchDocumentsQuery) {
        return this.documents.search(query);
    }
}
