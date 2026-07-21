import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentStoragePort } from "@/src/modules/documents/application/ports/document-storage.port";

export class SupabaseDocumentStorageAdapter implements DocumentStoragePort {
    constructor(private readonly supabase: SupabaseClient) {}

    async createSignedReadUrl(params: {
        bucket: string;
        path: string;
        expiresInSeconds: number;
    }): Promise<string> {
        const { data, error } = await this.supabase.storage
            .from(params.bucket)
            .createSignedUrl(params.path, params.expiresInSeconds);

        if (error || !data?.signedUrl) {
            throw new Error("Dokument-Link konnte nicht erstellt werden.");
        }

        return data.signedUrl;
    }

    async download(params: { bucket: string; path: string }): Promise<Blob> {
        const { data, error } = await this.supabase.storage
            .from(params.bucket)
            .download(params.path);

        if (error || !data) {
            throw new Error("Datei konnte nicht aus Storage geladen werden.");
        }

        return data;
    }

    async objectExists(params: { bucket: string; path: string }): Promise<boolean> {
        const { data, error } = await this.supabase.storage
            .from(params.bucket)
            .download(params.path);

        return !error && Boolean(data);
    }
}
