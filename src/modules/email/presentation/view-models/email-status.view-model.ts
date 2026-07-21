import { emailStatusLabels, type EmailSendStatus } from "@/src/modules/email/domain/constants/email-status";

export function getEmailStatusLabel(status: EmailSendStatus): string {
    return emailStatusLabels[status];
}

export function getEmailStatusBadgeVariant(status: EmailSendStatus): "default" | "secondary" | "destructive" | "outline" {
    if (status === "SENT" || status === "DELIVERED" || status === "LEGACY_SENT") {
        return "default";
    }

    if (status === "FAILED" || status === "BOUNCED" || status === "REJECTED") {
        return "destructive";
    }

    if (status === "DRAFT" || status === "READY_TO_SEND") {
        return "secondary";
    }

    return "outline";
}
