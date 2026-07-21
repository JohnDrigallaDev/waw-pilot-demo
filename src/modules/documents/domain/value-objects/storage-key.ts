import { FileName } from "@/src/modules/documents/domain/value-objects/file-name";

export class StorageKey {
    private constructor(readonly value: string) {}

    static forVersion(params: {
        companyId: string;
        documentId: string;
        versionNumber: number;
        fileName: FileName;
    }): StorageKey {
        return new StorageKey(
            [
                "companies",
                params.companyId,
                "documents",
                params.documentId,
                "versions",
                String(params.versionNumber),
                params.fileName.value,
            ].join("/"),
        );
    }
}
