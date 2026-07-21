import type {
    CorrectionReasonCode,
    InvoiceCorrectionDocumentType,
    InvoiceCorrectionScope,
    InvoiceCorrectionStatus,
} from "@/src/modules/invoice-corrections/domain/constants/correction-types";

export type InvoiceCorrectionEntity = {
    id: string;
    companyId: string;
    saleId: string;
    originalInvoiceId: string;
    correctionInvoiceId: string;
    documentType: InvoiceCorrectionDocumentType;
    scope: InvoiceCorrectionScope;
    status: InvoiceCorrectionStatus;
    reasonCode: CorrectionReasonCode;
    reasonText: string | null;
    customerVisibleReason: string | null;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    createdAt: string;
    finalizedAt: string | null;
    createdBy: string | null;
    finalizedBy: string | null;
};

export type SaleRefundEntity = {
    id: string;
    companyId: string;
    saleId: string;
    invoiceId: string | null;
    correctionInvoiceId: string | null;
    customerId: string;
    refundReference: string;
    amount: number;
    refundMethod: "cash" | "bank";
    refundDate: string;
    reason: string;
    externalReference: string | null;
    note: string | null;
    status: "active" | "voided";
    isVoided: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    voidedAt: string | null;
    voidedBy: string | null;
    voidReason: string | null;
};
