export type CalculatedPaymentStatus =
    | "open"
    | "partial"
    | "paid"
    | "overpaid";

export type PaymentCalculationInput = {
    amount: number;
    is_voided?: boolean | null;
};

function toCents(value: number): number {
    return Math.round(value * 100);
}

function fromCents(value: number): number {
    return value / 100;
}

export function calculatePaidAmount(
    payments: PaymentCalculationInput[],
): number {
    return fromCents(
        payments
            .filter((payment) => !payment.is_voided)
            .reduce((sum, payment) => sum + toCents(payment.amount), 0),
    );
}

export function calculateRemainingAmount(
    totalAmount: number,
    payments: PaymentCalculationInput[],
): number {
    return fromCents(toCents(totalAmount) - toCents(calculatePaidAmount(payments)));
}

export function isOverpaid(
    totalAmount: number,
    payments: PaymentCalculationInput[],
): boolean {
    return toCents(calculatePaidAmount(payments)) > toCents(totalAmount);
}

export function calculatePaymentStatus(
    totalAmount: number,
    payments: PaymentCalculationInput[],
): CalculatedPaymentStatus {
    const paidCents = toCents(calculatePaidAmount(payments));
    const totalCents = toCents(totalAmount);

    if (paidCents <= 0) return "open";
    if (paidCents < totalCents) return "partial";
    if (paidCents === totalCents) return "paid";

    return "overpaid";
}
