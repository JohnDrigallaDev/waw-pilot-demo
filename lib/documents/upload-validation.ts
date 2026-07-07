export const documentAcceptMimeTypes =
    "application/pdf,image/jpeg,image/png,image/webp";
export const imageAssetAcceptMimeTypes = "image/png,image/jpeg,image/webp";
export const maxImageAssetFileSizeBytes = 5 * 1024 * 1024;

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

export function isAllowedImageAssetFile(file: Pick<File, "name" | "type">): boolean {
    if (
        file.type &&
        (file.type === "image/png" ||
            file.type === "image/jpeg" ||
            file.type === "image/webp")
    ) {
        return true;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    return extension
        ? extension === "png" ||
              extension === "jpg" ||
              extension === "jpeg" ||
              extension === "webp"
        : false;
}

export function getUnsupportedDocumentTypeMessage(): string {
    return "Dieser Dateityp wird nicht unterstützt. Bitte wähle PDF, JPG, PNG oder WEBP.";
}

export function getUnsupportedImageAssetTypeMessage(): string {
    return "Dieser Dateityp wird nicht unterstützt. Bitte wähle PNG, JPG oder WEBP.";
}

export function getImageAssetTooLargeMessage(): string {
    return "Die Datei ist zu groß. Bitte wähle ein kleineres Bild bis 5 MB aus.";
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
