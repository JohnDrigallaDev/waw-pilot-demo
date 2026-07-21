import type { SupabaseClient } from "@supabase/supabase-js";

import type { EmailAuditPort } from "@/src/modules/email/application/ports/email-audit.port";

export class SupabaseEmailAuditAdapter implements EmailAuditPort {
    constructor(private readonly supabase: SupabaseClient) {}

    async record(params: {
        companyId: string;
        emailId: string | null;
        action: string;
        previousValues?: Record<string, unknown> | null;
        newValues?: Record<string, unknown> | null;
        reason?: string | null;
        actorId?: string | null;
    }): Promise<void> {
        const { error } = await this.supabase.from("email_audit_log").insert({
            company_id: params.companyId,
            email_message_id: params.emailId,
            action: params.action,
            previous_values: params.previousValues ?? null,
            new_values: params.newValues ?? null,
            reason: params.reason ?? null,
            changed_by: params.actorId ?? null,
        });

        if (error) {
            console.error("[email-audit] audit entry could not be stored", error.message);
        }
    }
}
