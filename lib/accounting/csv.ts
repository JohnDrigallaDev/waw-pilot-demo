const formulaInjectionPrefixPattern = /^[=+\-@\t\r]/;

export function sanitizeCsvCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";

    const rawValue = String(value);
    const safeValue = formulaInjectionPrefixPattern.test(rawValue)
        ? `'${rawValue}`
        : rawValue;

    if (
        safeValue.includes(";") ||
        safeValue.includes('"') ||
        safeValue.includes("\n")
    ) {
        return `"${safeValue.replaceAll('"', '""')}"`;
    }

    return safeValue;
}

export function createSemicolonCsv(rows: (string | number | null | undefined)[][]) {
    return `\uFEFF${rows.map((row) => row.map(sanitizeCsvCell).join(";")).join("\n")}`;
}

export function formatCsvDecimal(value: number | null | undefined): string {
    if (value === null || value === undefined) return "";
    return value.toFixed(2).replace(".", ",");
}
