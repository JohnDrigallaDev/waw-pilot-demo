import { logActivity } from "@/lib/activity/activity-log";
import type { EmailActivityPort } from "@/src/modules/email/application/ports/email-activity.port";

export class EmailActivityAdapter implements EmailActivityPort {
    async record(params: {
        action: string;
        entityType?: string;
        entityId?: string | null;
    }): Promise<void> {
        await logActivity(params);
    }
}
