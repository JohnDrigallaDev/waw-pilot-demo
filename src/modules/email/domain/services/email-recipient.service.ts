import { EmailRecipient } from "@/src/modules/email/domain/entities/email-recipient";

export class EmailRecipientService {
    createUniqueRecipients(
        recipients: Array<{ email: string; name?: string | null; kind: "to" | "cc" | "bcc" }>,
    ): EmailRecipient[] {
        const seenEmails = new Set<string>();

        return recipients
            .map((recipient) => new EmailRecipient(recipient))
            .filter((recipient) => {
                if (seenEmails.has(recipient.email.value)) {
                    return false;
                }

                seenEmails.add(recipient.email.value);
                return true;
            });
    }
}
