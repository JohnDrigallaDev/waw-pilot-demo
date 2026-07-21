export type ResolvedEmailAttachment = {
    documentId: string;
    documentVersionId: string | null;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    content: Buffer;
    attachmentType: string;
};

export interface EmailAttachmentReaderPort {
    readDocumentAttachment(params: {
        companyId: string;
        documentId: string;
        documentVersionId?: string | null;
        attachmentType: string;
    }): Promise<ResolvedEmailAttachment>;
}
