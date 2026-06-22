const PHONE_PATTERN = /^[0-9+\-\/()\s]+$/;

export function sanitizePhoneInput(value: string): string {
    return value.replace(/[^0-9+\-\/()\s]/g, "");
}

export function isValidPhoneNumber(value: string | null): boolean {
    if (!value) return true;

    return PHONE_PATTERN.test(value);
}

export const phoneInputPattern = "[0-9+\\-\\/()\\s]*";
