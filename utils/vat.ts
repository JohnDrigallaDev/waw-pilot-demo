export type SaleVatContext = {
    saleType?: "domestic" | "eu" | "third_country" | string | null;
    customerType?: "company" | "private" | string | null;
    fallbackRate?: number;
};

export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateVat(netAmount: number, vatRate: number): number {
    return roundMoney(netAmount * (vatRate / 100));
}

export function calculateGross(netAmount: number, vatRate: number): number {
    return roundMoney(netAmount + calculateVat(netAmount, vatRate));
}

export function calculateNet(grossAmount: number, vatRate: number): number {
    if (vatRate <= 0) return roundMoney(grossAmount);

    return roundMoney(grossAmount / (1 + vatRate / 100));
}

export function determineDefaultVat(context: SaleVatContext = {}): number {
    if (context.saleType === "eu" || context.saleType === "third_country") return 0;

    return context.fallbackRate ?? 19;
}
