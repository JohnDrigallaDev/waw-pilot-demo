export function formatPdfDate(dateString: string | null | undefined): string {
    if (!dateString) return "—";

    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (dateOnlyMatch) {
        return `${dateOnlyMatch[3]}.${dateOnlyMatch[2]}.${dateOnlyMatch[1]}`;
    }

    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(dateString));
}

export function formatPdfCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

export function formatPdfText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
}

export function joinPdfLines(
    lines: (string | number | null | undefined)[],
): string[] {
    return lines
        .map((line) => {
            if (line === null || line === undefined) return "";
            return String(line).trim();
        })
        .filter((line) => line.length > 0);
}
