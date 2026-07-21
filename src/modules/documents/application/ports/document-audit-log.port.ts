export interface DocumentAuditLogPort {
    record(params: {
        companyId: string;
        documentId: string;
        action: string;
        previousValues?: Record<string, unknown> | null;
        newValues?: Record<string, unknown> | null;
        changedBy?: string | null;
        reason?: string | null;
    }): Promise<void>;
}
