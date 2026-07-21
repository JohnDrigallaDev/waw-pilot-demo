import { Badge } from "@/components/ui/badge";
import type { EmailSendStatus } from "@/src/modules/email/domain/constants/email-status";
import {
    getEmailStatusBadgeVariant,
    getEmailStatusLabel,
} from "@/src/modules/email/presentation/view-models/email-status.view-model";

export function EmailStatusBadge({ status }: { status: EmailSendStatus }) {
    return (
        <Badge variant={getEmailStatusBadgeVariant(status)}>
            {getEmailStatusLabel(status)}
        </Badge>
    );
}
