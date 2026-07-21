import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentAuditLogPort } from "@/src/modules/documents/application/ports/document-audit-log.port";

export class SupabaseDocumentAuditLogAdapter implements DocumentAuditLogPort {
    constructor(private readonly supabase: SupabaseClient) {}

    async record(params: {
        companyId: string;
        documentId: string;
        action: string;
        previousValues?: Record<string, unknown> | null;
        newValues?: Record<string, unknown> | null;
        changedBy?: string | null;
        reason?: string | null;
    }): Promise<void> {
        const { error } = await this.supabase.from("document_audit_log").insert({
            company_id: params.companyId,
            document_id: params.documentId,
            action: params.action,
            previous_values: params.previousValues ?? null,
            new_values: params.newValues ?? null,
            changed_by: params.changedBy ?? null,
            reason: params.reason ?? null,
        });

        if (error) {
            throw new Error(`Dokument-Audit konnte nicht geschrieben werden: ${error.message}`);
        }
    }
}
