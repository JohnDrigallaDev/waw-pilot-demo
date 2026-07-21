export type CreateCancellationInvoiceCommand = {
    companyId: string;
    originalInvoiceId: string;
    reasonCode: string;
    reasonText: string | null;
    customerVisibleReason: string | null;
    createdBy: string | null;
};
