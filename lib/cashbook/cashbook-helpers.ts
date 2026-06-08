import type {
    CashbookEntryRow,
    CashbookEntryType,
    CashbookPaymentMethod,
} from "@/lib/cashbook/cashbook-queries";

export function getCashbookTypeLabel(type: CashbookEntryType): string {
    const labels: Record<CashbookEntryType, string> = {
        income: "Einnahme",
        expense: "Ausgabe",
    };

    return labels[type];
}

export function getCashbookPaymentMethodLabel(
    method: CashbookPaymentMethod,
): string {
    const labels: Record<CashbookPaymentMethod, string> = {
        cash: "Bar",
        bank: "Bank",
    };

    return labels[method];
}

export function getCashbookCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        vehicle_sale: "Fahrzeugverkauf",
        vehicle_purchase: "Fahrzeugeinkauf",
        transport: "Transport",
        repair: "Reparatur",
        customs: "Zoll",
        office: "Büro",
        other: "Sonstiges",
    };

    return labels[category] ?? category;
}

export function getCashbookTypeTone(
    type: CashbookEntryType,
): "success" | "danger" {
    if (type === "income") return "success";
    return "danger";
}

export function calculateTotalIncome(entries: CashbookEntryRow[]): number {
    return entries
        .filter((entry) => entry.entry_type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);
}

export function calculateTotalExpenses(entries: CashbookEntryRow[]): number {
    return entries
        .filter((entry) => entry.entry_type === "expense")
        .reduce((sum, entry) => sum + entry.amount, 0);
}

export function calculateBalance(entries: CashbookEntryRow[]): number {
    return calculateTotalIncome(entries) - calculateTotalExpenses(entries);
}

export function calculatePaymentMethodBalance(
    entries: CashbookEntryRow[],
    method: CashbookPaymentMethod,
): number {
    return entries
        .filter((entry) => entry.payment_method === method)
        .reduce((sum, entry) => {
            if (entry.entry_type === "income") return sum + entry.amount;
            return sum - entry.amount;
        }, 0);
}