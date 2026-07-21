import type { RegisterRefundCommand } from "@/src/modules/invoice-corrections/application/commands/register-refund.command";
import type { CorrectionActivityPort } from "@/src/modules/invoice-corrections/application/ports/correction-activity.port";
import type { CorrectionFinancialJournalPort } from "@/src/modules/invoice-corrections/application/ports/correction-financial-journal.port";
import type { InvoiceCorrectionRepository } from "@/src/modules/invoice-corrections/application/ports/invoice-correction-repository.port";
import { RefundNotAllowedError } from "@/src/modules/invoice-corrections/domain/errors/invoice-correction-errors";
import { CorrectionCalculationService } from "@/src/modules/invoice-corrections/domain/services/correction-calculation.service";

export class RegisterRefundUseCase {
    private readonly calculation = new CorrectionCalculationService();

    constructor(
        private readonly corrections: InvoiceCorrectionRepository,
        private readonly financialJournal: CorrectionFinancialJournalPort,
        private readonly activity: CorrectionActivityPort,
    ) {}

    async execute(command: RegisterRefundCommand) {
        if (command.amount <= 0 || !command.reason.trim()) {
            throw new RefundNotAllowedError();
        }

        const invoiceId = command.invoiceId ?? command.correctionInvoiceId;
        if (!invoiceId) throw new RefundNotAllowedError();

        const summary = await this.corrections.getCorrectionSummary({
            companyId: command.companyId,
            invoiceId,
        });

        if (!summary || summary.outstandingRefundAmount <= 0) {
            throw new RefundNotAllowedError();
        }

        this.calculation.assertRefundAmountAllowed({
            requestedAmount: command.amount,
            outstandingRefundAmount: summary.outstandingRefundAmount,
        });

        const result = await this.corrections.registerRefund(command, summary);

        await this.financialJournal.syncRefund({
            companyId: command.companyId,
            refundId: result.refundId,
        });
        await this.activity.record({
            action: `Rückzahlung ${result.refundReference} über ${command.amount.toFixed(2)} € wurde erfasst.`,
            entityType: "sale",
            entityId: result.saleId,
        });

        return result;
    }
}
