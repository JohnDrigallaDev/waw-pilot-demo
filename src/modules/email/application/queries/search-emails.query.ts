import type { EmailContextType } from "@/src/modules/email/domain/constants/email-context";
import type { EmailSendStatus } from "@/src/modules/email/domain/constants/email-status";

export type SearchEmailsQuery = {
    companyId: string;
    search?: string | null;
    status?: EmailSendStatus | null;
    contextType?: EmailContextType | null;
    contextId?: string | null;
    offset?: number;
    limit?: number;
};
