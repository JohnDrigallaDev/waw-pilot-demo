import { InvalidFileNameError } from "@/src/modules/documents/domain/errors/document-errors";

export class FileName {
    private constructor(readonly value: string) {}

    static create(rawValue: string): FileName {
        const value = rawValue.trim();

        if (!value) {
            throw new InvalidFileNameError();
        }

        return new FileName(value.replace(/[\\/:*?"<>|]+/g, "-"));
    }

    get extension(): string {
        return this.value.split(".").pop()?.toLowerCase() ?? "";
    }
}
