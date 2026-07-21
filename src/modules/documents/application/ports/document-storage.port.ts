export interface DocumentStoragePort {
    createSignedReadUrl(params: {
        bucket: string;
        path: string;
        expiresInSeconds: number;
    }): Promise<string>;
    download(params: {
        bucket: string;
        path: string;
    }): Promise<Blob>;
    objectExists(params: {
        bucket: string;
        path: string;
    }): Promise<boolean>;
}
