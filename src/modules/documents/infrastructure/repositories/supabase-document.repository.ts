import type { SupabaseClient } from "@supabase/supabase-js";

import type { ArchiveDocumentCommand } from "@/src/modules/documents/application/commands/archive-document.command";
import type { DocumentRepository } from "@/src/modules/documents/application/ports/document-repository.port";
import type { GetDocumentDetailQuery } from "@/src/modules/documents/application/queries/get-document-detail.query";
import type { SearchDocumentsQuery } from "@/src/modules/documents/application/queries/search-documents.query";
import {
    mapSupabaseDocumentRowToDetail,
    mapSupabaseDocumentRowToListItem,
    type SupabaseDocumentRow,
} from "@/src/modules/documents/infrastructure/mappers/supabase-document.mapper";

const documentSelect = `
  id,
  document_reference,
  document_type,
  title,
  description,
  source,
  status,
  archive_status,
  active_version_id,
  file_name,
  file_path,
  mime_type,
  file_size,
  customer_id,
  vehicle_id,
  sale_id,
  invoice_id,
  generated_by_system,
  created_at,
  updated_at,
  created_by,
  updated_by,
  archived_at,
  archived_by,
  archive_reason,
  metadata,
  customers (
    type,
    company_name,
    first_name,
    last_name
  ),
  vehicles (
    internal_number,
    manufacturer,
    model
  ),
  invoices!documents_invoice_id_fkey (
    invoice_number
  ),
  document_versions (
    id,
    company_id,
    document_id,
    version_number,
    original_file_name,
    stored_file_name,
    storage_bucket,
    storage_path,
    mime_type,
    file_size_bytes,
    checksum,
    uploaded_at,
    uploaded_by,
    is_active,
    replaced_version_id,
    replacement_reason,
    metadata
  ),
  document_relations (
    id,
    company_id,
    document_id,
    relation_type,
    relation_id,
    created_at,
    created_by,
    metadata
  )
`;

export class SupabaseDocumentRepository implements DocumentRepository {
    constructor(private readonly supabase: SupabaseClient) {}

    async search(query: SearchDocumentsQuery) {
        let request = this.supabase
            .from("documents")
            .select(documentSelect, { count: "exact" })
            .eq("company_id", query.companyId)
            .neq("status", "missing")
            .order("created_at", { ascending: false });

        if (query.archiveStatus) {
            request = request.eq("archive_status", query.archiveStatus);
        } else {
            request = request.or("archive_status.is.null,archive_status.eq.ACTIVE");
        }

        if (query.status) {
            request = request.eq("status", query.status);
        }

        if (query.documentType) {
            request = request.eq("document_type", query.documentType);
        }

        if (query.vehicleId) {
            request = request.eq("vehicle_id", query.vehicleId);
        }

        if (query.needsReviewOnly) {
            request = request.eq("status", "needs_review");
        }

        const normalizedSearch = query.search?.trim();
        if (normalizedSearch) {
            request = request.or(
                [
                    `document_reference.ilike.%${normalizedSearch}%`,
                    `title.ilike.%${normalizedSearch}%`,
                    `file_name.ilike.%${normalizedSearch}%`,
                    `document_type.ilike.%${normalizedSearch}%`,
                ].join(","),
            );
        }

        const offset = query.offset ?? 0;
        const limit = query.limit ?? 200;
        request = request.range(offset, offset + limit - 1);

        const { data, error, count } = await request;

        if (error) {
            throw new Error(`Dokumente konnten nicht geladen werden: ${error.message}`);
        }

        return {
            documents: ((data ?? []) as unknown as SupabaseDocumentRow[]).map(
                mapSupabaseDocumentRowToListItem,
            ),
            totalCount: count ?? 0,
        };
    }

    async findDetail(query: GetDocumentDetailQuery) {
        const { data, error } = await this.supabase
            .from("documents")
            .select(documentSelect)
            .eq("company_id", query.companyId)
            .eq("id", query.documentId)
            .single();

        if (error || !data) {
            return null;
        }

        return mapSupabaseDocumentRowToDetail(data as unknown as SupabaseDocumentRow);
    }

    async findActiveFile(params: {
        companyId: string;
        documentId: string;
        versionId?: string;
    }) {
        if (params.versionId) {
            const { data, error } = await this.supabase
                .from("document_versions")
                .select("id, document_id, storage_bucket, storage_path, original_file_name, mime_type")
                .eq("company_id", params.companyId)
                .eq("document_id", params.documentId)
                .eq("id", params.versionId)
                .single();

            if (error || !data) return null;

            return {
                documentId: data.document_id as string,
                fileName: data.original_file_name as string,
                mimeType: data.mime_type as string | null,
                storageBucket: data.storage_bucket as string,
                storagePath: data.storage_path as string,
                versionId: data.id as string,
            };
        }

        const { data: version } = await this.supabase
            .from("document_versions")
            .select("id, document_id, storage_bucket, storage_path, original_file_name, mime_type")
            .eq("company_id", params.companyId)
            .eq("document_id", params.documentId)
            .eq("is_active", true)
            .maybeSingle();

        if (version) {
            return {
                documentId: version.document_id as string,
                fileName: version.original_file_name as string,
                mimeType: version.mime_type as string | null,
                storageBucket: version.storage_bucket as string,
                storagePath: version.storage_path as string,
                versionId: version.id as string,
            };
        }

        const { data: legacyDocument, error } = await this.supabase
            .from("documents")
            .select("id, file_name, file_path, mime_type")
            .eq("company_id", params.companyId)
            .eq("id", params.documentId)
            .single();

        if (error || !legacyDocument?.file_path) return null;

        return {
            documentId: legacyDocument.id as string,
            fileName: legacyDocument.file_name as string,
            mimeType: legacyDocument.mime_type as string | null,
            storageBucket: "documents",
            storagePath: legacyDocument.file_path as string,
            versionId: null,
        };
    }

    async archive(command: ArchiveDocumentCommand): Promise<void> {
        const { error } = await this.supabase
            .from("documents")
            .update({
                archive_status: "ARCHIVED",
                status: "archived",
                archived_at: new Date().toISOString(),
                archived_by: command.archivedBy,
                archive_reason: command.reason,
                updated_at: new Date().toISOString(),
                updated_by: command.archivedBy,
            })
            .eq("company_id", command.companyId)
            .eq("id", command.documentId);

        if (error) {
            throw new Error(`Dokument konnte nicht archiviert werden: ${error.message}`);
        }
    }
}
