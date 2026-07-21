import type { EmailContextType } from "@/src/modules/email/domain/constants/email-context";
import type { EmailSendStatus } from "@/src/modules/email/domain/constants/email-status";
import type { EmailTemplateKey } from "@/src/modules/email/domain/constants/email-template-keys";

export type EmailRecipientDto = {
    email: string;
    name: string | null;
};

export type EmailAttachmentDto = {
    id: string;
    documentId: string | null;
    documentVersionId: string | null;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    attachmentType: string;
};

export type EmailMessageDto = {
    id: string;
    emailReference: string;
    contextType: EmailContextType;
    contextId: string | null;
    templateKey: string | null;
    senderName: string;
    senderEmail: string;
    toRecipients: EmailRecipientDto[];
    ccRecipients: EmailRecipientDto[];
    bccRecipients: EmailRecipientDto[];
    subject: string;
    bodyHtml: string;
    bodyText: string | null;
    status: EmailSendStatus;
    provider: string;
    sentAt: string | null;
    failedAt: string | null;
    failureMessage: string | null;
    retryCount: number;
    attachments: EmailAttachmentDto[];
    createdAt: string;
};

export type EmailListItemDto = {
    id: string;
    emailReference: string;
    status: EmailSendStatus;
    contextType: EmailContextType;
    contextId: string | null;
    templateKey: string | null;
    toRecipients: EmailRecipientDto[];
    subject: string;
    sentAt: string | null;
    createdAt: string;
    attachmentCount: number;
};

export type EmailSearchResultDto = {
    emails: EmailListItemDto[];
    totalCount: number;
};

export type EmailTemplateDto = {
    templateKey: EmailTemplateKey | string;
    name: string;
    contextType: EmailContextType;
    subjectTemplate: string;
    bodyHtmlTemplate: string;
    bodyTextTemplate: string | null;
};
