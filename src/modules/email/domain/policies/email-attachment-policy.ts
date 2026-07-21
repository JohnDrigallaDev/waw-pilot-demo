import { EmailTotalSizeExceededError } from "@/src/modules/email/domain/errors/email-errors";
import type { EmailAttachment } from "@/src/modules/email/domain/entities/email-attachment";

export const emailAttachmentLimits = {
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxTotalSizeBytes: 20 * 1024 * 1024,
    maxAttachmentCount: 10,
};

export class EmailAttachmentPolicy {
    assertWithinTotalLimit(attachments: EmailAttachment[]): void {
        const totalBytes = attachments.reduce(
            (sum, attachment) => sum + attachment.props.fileSizeBytes,
            0,
        );

        if (
            totalBytes > emailAttachmentLimits.maxTotalSizeBytes ||
            attachments.length > emailAttachmentLimits.maxAttachmentCount
        ) {
            throw new EmailTotalSizeExceededError(
                "Die Gesamtgröße oder Anzahl der Anhänge ist zu groß.",
            );
        }
    }
}
