export const emailContextTypes = [
    "SALE",
    "PURCHASE",
    "VEHICLE",
    "CUSTOMER",
    "PARTNER",
    "INVOICE",
    "PAYMENT",
    "REFUND",
    "DOCUMENT",
    "FINANCIAL_ENTRY",
    "GENERAL",
] as const;

export type EmailContextType = (typeof emailContextTypes)[number];
