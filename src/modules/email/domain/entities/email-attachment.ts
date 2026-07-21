import {
    EmailAttachmentTooLargeError,
} from "@/src/modules/email/domain/errors/email-errors";

export type EmailAttachmentProps = {
    documentId?: string | null;
    documentVersionId?: string | null;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    attachmentType: string;
};

export class EmailAttachment {
    private constructor(readonly props: EmailAttachmentProps) {}

    static create(props: EmailAttachmentProps, maxFileSizeBytes: number): EmailAttachment {
        if (props.fileSizeBytes > maxFileSizeBytes) {
            throw new EmailAttachmentTooLargeError(
                `Der Anhang "${props.fileName}" ist zu groß.`,
            );
        }

        return new EmailAttachment({
            ...props,
            fileName: props.fileName.trim(),
            mimeType: props.mimeType.trim() || "application/octet-stream",
        });
    }
}
