export interface EmailAuditPort {
    record(params: {
        companyId: string;
        emailId: string | null;
        action: string;
        previousValues?: Record<string, unknown> | null;
        newValues?: Record<string, unknown> | null;
        reason?: string | null;
        actorId?: string | null;
    }): Promise<void>;
}
