export type InvoiceCorrectionDocumentType =
    | "cancellation_invoice"
    | "credit_note";

export type InvoiceCorrectionScope = "full" | "amount";

export type InvoiceCorrectionStatus =
    | "DRAFT"
    | "FINALIZATION_PENDING"
    | "FINALIZED"
    | "FINALIZATION_FAILED"
    | "VOIDED";

export type RefundStatus =
    | "active"
    | "voided";

export type RefundRequirementStatus =
    | "NO_REFUND_REQUIRED"
    | "REFUND_REQUIRED"
    | "PARTIALLY_REFUNDED"
    | "FULLY_REFUNDED"
    | "OVER_REFUNDED";

export type CorrectionReasonCode =
    | "contract_cancelled"
    | "incorrect_invoice"
    | "price_reduction"
    | "vehicle_defect"
    | "vehicle_return"
    | "duplicate_invoice"
    | "wrong_customer"
    | "wrong_tax_treatment"
    | "other";

export const correctionReasonDefinitions: {
    code: CorrectionReasonCode;
    label: string;
    requiresText: boolean;
}[] = [
    { code: "contract_cancelled", label: "Kaufvertrag aufgehoben", requiresText: false },
    { code: "incorrect_invoice", label: "Rechnung falsch ausgestellt", requiresText: false },
    { code: "price_reduction", label: "Preisnachlass", requiresText: false },
    { code: "vehicle_defect", label: "Fahrzeugmangel", requiresText: false },
    { code: "vehicle_return", label: "Fahrzeugrückgabe", requiresText: false },
    { code: "duplicate_invoice", label: "Doppelberechnung", requiresText: false },
    { code: "wrong_customer", label: "Falscher Kunde", requiresText: false },
    { code: "wrong_tax_treatment", label: "Falsche Steuerbehandlung", requiresText: false },
    { code: "other", label: "Sonstiger Grund", requiresText: true },
];

export function getCorrectionReasonLabel(code: string): string {
    return (
        correctionReasonDefinitions.find((reason) => reason.code === code)?.label ??
        code
    );
}
