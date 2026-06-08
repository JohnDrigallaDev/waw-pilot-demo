export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return "-";

    const date = typeof value === "string" ? new Date(value) : value;

    return new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}