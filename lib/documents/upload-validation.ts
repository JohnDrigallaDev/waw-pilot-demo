export const documentAcceptMimeTypes =
    "application/pdf,image/jpeg,image/png,image/webp";

const allowedDocumentMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const allowedDocumentExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

export function isAllowedDocumentFile(file: Pick<File, "name" | "type">): boolean {
    if (file.type && allowedDocumentMimeTypes.has(file.type)) {
        return true;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    return extension ? allowedDocumentExtensions.has(extension) : false;
}

export function getUnsupportedDocumentTypeMessage(): string {
    return "Dieser Dateityp wird nicht unterstützt. Bitte wähle PDF, JPG, PNG oder WEBP.";
}

export function getDocumentUploadFailedMessage(error: unknown): string {
    const message =
        error && typeof error === "object" && "message" in error
            ? String((error as { message?: unknown }).message ?? "")
            : String(error ?? "");
    const normalizedMessage = message.toLowerCase();

    if (
        normalizedMessage.includes("too large") ||
        normalizedMessage.includes("file size") ||
        normalizedMessage.includes("payload") ||
        normalizedMessage.includes("maximum")
    ) {
        return "Die Datei ist zu groß. Bitte wähle eine kleinere Datei.";
    }

    if (
        normalizedMessage.includes("mime") ||
        normalizedMessage.includes("content type") ||
        normalizedMessage.includes("unsupported")
    ) {
        return getUnsupportedDocumentTypeMessage();
    }

    return "Dokument konnte nicht hochgeladen werden. Bitte versuche es erneut.";
}
