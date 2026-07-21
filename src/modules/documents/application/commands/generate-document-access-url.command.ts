export type GenerateDocumentAccessUrlCommand = {
    companyId: string;
    documentId: string;
    versionId?: string;
    expiresInSeconds?: number;
};
