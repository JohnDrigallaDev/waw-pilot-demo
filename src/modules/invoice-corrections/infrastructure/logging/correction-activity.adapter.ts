import { logActivity } from "@/lib/activity/activity-log";
import type { CorrectionActivityPort } from "@/src/modules/invoice-corrections/application/ports/correction-activity.port";

export class CorrectionActivityAdapter implements CorrectionActivityPort {
    record(params: {
        action: string;
        entityType: string;
        entityId: string;
    }): Promise<void> {
        return logActivity(params);
    }
}
