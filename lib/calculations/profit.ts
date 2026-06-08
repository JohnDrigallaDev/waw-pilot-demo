export type ProfitInput = {
    purchasePriceNet: number;
    salePriceNet: number;
    additionalCostsNet?: number;
};

export function calculateGrossProfitNet(input: ProfitInput): number {
    return input.salePriceNet - input.purchasePriceNet - (input.additionalCostsNet ?? 0);
}

export function calculateProfitMargin(input: ProfitInput): number {
    if (input.salePriceNet <= 0) return 0;

    const profit = calculateGrossProfitNet(input);
    return (profit / input.salePriceNet) * 100;
}