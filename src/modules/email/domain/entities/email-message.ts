import type { EmailContextType } from "@/src/modules/email/domain/constants/email-context";
import type { EmailSendStatus } from "@/src/modules/email/domain/constants/email-status";
import { canTransitionEmailStatus } from "@/src/modules/email/domain/constants/email-status";
import {
    EmailAlreadySentError,
    EmailSendInProgressError,
    MissingEmailBodyError,
    MissingEmailSubjectError,
    MissingRecipientError,
} from "@/src/modules/email/domain/errors/email-errors";
import type { EmailAttachment } from "@/src/modules/email/domain/entities/email-attachment";
import type { EmailRecipient } from "@/src/modules/email/domain/entities/email-recipient";

export type EmailMessageProps = {
    companyId: string;
    contextType: EmailContextType;
    contextId: string | null;
    subject: string;
    bodyHtml: string;
    bodyText: string | null;
    recipients: EmailRecipient[];
    attachments: EmailAttachment[];
    status: EmailSendStatus;
};

export class EmailMessage {
    constructor(readonly props: EmailMessageProps) {}

    validateBeforeSend(): void {
        const toRecipients = this.props.recipients.filter(
            (recipient) => recipient.kind === "to",
        );

        if (toRecipients.length === 0) {
            throw new MissingRecipientError("Mindestens ein Empfänger ist erforderlich.");
        }

        if (!this.props.subject.trim()) {
            throw new MissingEmailSubjectError("Der Betreff ist erforderlich.");
        }

        if (!this.props.bodyHtml.trim() && !this.props.bodyText?.trim()) {
            throw new MissingEmailBodyError("Der E-Mail-Text ist erforderlich.");
        }

        if (this.props.status === "SENT" || this.props.status === "DELIVERED") {
            throw new EmailAlreadySentError("Diese E-Mail wurde bereits versendet.");
        }

        if (this.props.status === "SENDING") {
            throw new EmailSendInProgressError("Diese E-Mail wird bereits versendet.");
        }
    }

    assertTransition(nextStatus: EmailSendStatus): void {
        if (!canTransitionEmailStatus(this.props.status, nextStatus)) {
            throw new EmailAlreadySentError("Dieser Statuswechsel ist nicht zulässig.");
        }
    }
}
