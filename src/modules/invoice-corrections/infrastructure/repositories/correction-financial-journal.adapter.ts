import {
    syncCorrectionInvoiceFinancialEntry,
    syncSaleRefundFinancialEntry,
} from "@/lib/accounting/financial-sync";
import type { CorrectionFinancialJournalPort } from "@/src/modules/invoice-corrections/application/ports/correction-financial-journal.port";

export class CorrectionFinancialJournalAdapter implements CorrectionFinancialJournalPort {
    async syncCorrectionInvoice(params: {
        companyId: string;
        invoiceId: string;
    }): Promise<void> {
        await syncCorrectionInvoiceFinancialEntry(params);
    }

    async syncRefund(params: {
        companyId: string;
        refundId: string;
    }): Promise<void> {
        await syncSaleRefundFinancialEntry(params);
    }
}
