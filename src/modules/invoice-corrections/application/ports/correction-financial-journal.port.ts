export interface CorrectionFinancialJournalPort {
    syncCorrectionInvoice(params: {
        companyId: string;
        invoiceId: string;
    }): Promise<void>;
    syncRefund(params: {
        companyId: string;
        refundId: string;
    }): Promise<void>;
}
