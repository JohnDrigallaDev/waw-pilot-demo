export type CorrectionInvoiceSnapshotDto = {
    id: string;
    companyId: string;
    saleId: string;
    customerId: string;
    vehicleId: string;
    invoiceType: string;
    invoiceNumber: string;
    invoiceDate: string;
    status: string;
    netAmount: number;
    vatRate: number;
    vatAmount: number;
    grossAmount: number;
};

export type CorrectionSummaryDto = {
    originalInvoice: CorrectionInvoiceSnapshotDto;
    existingCorrectionGrossAmount: number;
    remainingCorrectableAmount: number;
    effectiveInvoiceAmount: number;
    paidAmount: number;
    refundedAmount: number;
    outstandingRefundAmount: number;
    refundStatus: string;
    canCancel: boolean;
};

export type CorrectionHistoryItemDto = {
    id: string;
    type: "invoice" | "payment" | "refund";
    label: string;
    date: string;
    amount: number;
    status: string;
};
