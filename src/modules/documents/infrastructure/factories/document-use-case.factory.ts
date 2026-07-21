import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ArchiveDocumentUseCase } from "@/src/modules/documents/application/use-cases/archive-document.use-case";
import { GenerateDocumentAccessUrlUseCase } from "@/src/modules/documents/application/use-cases/generate-document-access-url.use-case";
import { GetDocumentDetailUseCase } from "@/src/modules/documents/application/use-cases/get-document-detail.use-case";
import { SearchDocumentsUseCase } from "@/src/modules/documents/application/use-cases/search-documents.use-case";
import { SupabaseDocumentAuditLogAdapter } from "@/src/modules/documents/infrastructure/logging/supabase-document-audit-log.adapter";
import { SupabaseDocumentRepository } from "@/src/modules/documents/infrastructure/repositories/supabase-document.repository";
import { SupabaseDocumentStorageAdapter } from "@/src/modules/documents/infrastructure/storage/supabase/supabase-document-storage.adapter";

export function createDocumentUseCases() {
    const supabase = createServerSupabaseClient();
    const repository = new SupabaseDocumentRepository(supabase);
    const storage = new SupabaseDocumentStorageAdapter(supabase);
    const auditLog = new SupabaseDocumentAuditLogAdapter(supabase);

    return {
        searchDocuments: new SearchDocumentsUseCase(repository),
        getDocumentDetail: new GetDocumentDetailUseCase(repository),
        generateDocumentAccessUrl: new GenerateDocumentAccessUrlUseCase(repository, storage),
        archiveDocument: new ArchiveDocumentUseCase(repository, auditLog),
    };
}
