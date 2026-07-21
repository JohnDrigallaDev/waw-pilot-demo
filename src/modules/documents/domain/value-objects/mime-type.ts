import { InvalidMimeTypeError } from "@/src/modules/documents/domain/errors/document-errors";

export class MimeType {
    private constructor(readonly value: string) {}

    static create(rawValue: string, allowedMimeTypes: readonly string[]): MimeType {
        const value = rawValue.trim().toLowerCase();

        if (!allowedMimeTypes.includes(value)) {
            throw new InvalidMimeTypeError(value);
        }

        return new MimeType(value);
    }
}
