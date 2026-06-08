export function formatCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;

    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(safeValue);
}