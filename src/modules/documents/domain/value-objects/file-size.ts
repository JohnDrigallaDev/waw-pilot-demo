import { FileTooLargeError, InvalidFileSizeError } from "@/src/modules/documents/domain/errors/document-errors";

export class FileSize {
    private constructor(readonly bytes: number) {}

    static create(bytes: number, maxBytes: number): FileSize {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            throw new InvalidFileSizeError();
        }

        if (bytes > maxBytes) {
            throw new FileTooLargeError(maxBytes);
        }

        return new FileSize(bytes);
    }
}
