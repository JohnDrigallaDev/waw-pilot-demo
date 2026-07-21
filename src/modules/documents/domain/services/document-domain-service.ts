import { getDocumentTypeDefinition } from "@/src/modules/documents/domain/constants/document-types";
import { DuplicateDocumentVersionError } from "@/src/modules/documents/domain/errors/document-errors";
import { FileName } from "@/src/modules/documents/domain/value-objects/file-name";
import { FileSize } from "@/src/modules/documents/domain/value-objects/file-size";
import { MimeType } from "@/src/modules/documents/domain/value-objects/mime-type";

export class DocumentDomainService {
    validateUploadFile(params: {
        documentType: string;
        fileName: string;
        mimeType: string;
        fileSizeBytes: number;
    }): {
        fileName: FileName;
        mimeType: MimeType;
        fileSize: FileSize;
    } {
        const definition = getDocumentTypeDefinition(params.documentType);

        return {
            fileName: FileName.create(params.fileName),
            mimeType: MimeType.create(params.mimeType, definition.allowedMimeTypes),
            fileSize: FileSize.create(params.fileSizeBytes, definition.maxFileSizeBytes),
        };
    }

    assertChecksumDiffers(params: {
        activeChecksum: string | null;
        nextChecksum: string | null;
    }): void {
        if (params.activeChecksum && params.nextChecksum && params.activeChecksum === params.nextChecksum) {
            throw new DuplicateDocumentVersionError();
        }
    }
}
