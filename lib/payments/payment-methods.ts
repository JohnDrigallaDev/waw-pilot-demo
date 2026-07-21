export type PaymentMethod = "cash" | "bank";

export const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: "Bar" },
    { value: "bank", label: "Bank" },
];

export function isPaymentMethod(value: string | null): value is PaymentMethod {
    return value === "cash" || value === "bank";
}

export function getPaymentMethodLabel(method: PaymentMethod | string): string {
    const match = paymentMethods.find((item) => item.value === method);

    return match?.label ?? method;
}
