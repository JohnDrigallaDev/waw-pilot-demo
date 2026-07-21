export type RegisterRefundCommand = {
    companyId: string;
    saleId: string;
    invoiceId: string | null;
    correctionInvoiceId: string | null;
    amount: number;
    refundMethod: "cash" | "bank";
    refundDate: string;
    reason: string;
    externalReference: string | null;
    note: string | null;
    createdBy: string | null;
};
