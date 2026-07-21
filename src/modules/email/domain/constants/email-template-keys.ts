export const emailTemplateKeys = [
    "invoice.send",
    "invoice.zugferd.send",
    "invoice.cancellation.send",
    "invoice.credit-note.send",
    "payment.receipt.send",
    "refund.receipt.send",
    "vehicle.documents.send",
    "purchase.documents.send",
    "documents.free",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];
