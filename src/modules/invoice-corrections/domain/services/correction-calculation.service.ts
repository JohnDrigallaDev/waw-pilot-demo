import {
    type RefundRequirementStatus,
} from "@/src/modules/invoice-corrections/domain/constants/correction-types";
import {
    CorrectionAmountExceedsRemainingAmountError,
    RefundAmountExceedsOutstandingAmountError,
} from "@/src/modules/invoice-corrections/domain/errors/invoice-correction-errors";
import { Money } from "@/src/modules/invoice-corrections/domain/value-objects/money";

export type CorrectionAmountInput = {
    grossAmount: number;
    isVoided?: boolean | null;
    status?: string | null;
};

export type PaymentAmountInput = {
    amount: number;
    isVoided?: boolean | null;
};

export class CorrectionCalculationService {
    calculateRemainingCorrectableAmount(params: {
        originalGrossAmount: number;
        corrections: readonly CorrectionAmountInput[];
    }): number {
        const original = Money.fromDecimal(params.originalGrossAmount);
        const corrected = params.corrections
            .filter((correction) => !correction.isVoided && correction.status !== "VOIDED")
            .reduce(
                (sum, correction) => sum.add(Money.fromDecimal(Math.abs(correction.grossAmount))),
                Money.zero(),
            );
        const remaining = original.subtract(corrected);

        return Math.max(remaining.toDecimal(), 0);
    }

    assertCorrectionAmountAllowed(params: {
        requestedGrossAmount: number;
        remainingCorrectableAmount: number;
    }): void {
        if (
            Money.fromDecimal(params.requestedGrossAmount).isGreaterThan(
                Money.fromDecimal(params.remainingCorrectableAmount),
            )
        ) {
            throw new CorrectionAmountExceedsRemainingAmountError();
        }
    }

    calculateOutstandingRefundAmount(params: {
        paidAmount: number;
        effectiveInvoiceAmount: number;
        refunds: readonly PaymentAmountInput[];
    }): number {
        const paid = Money.fromDecimal(params.paidAmount);
        const effectiveInvoice = Money.fromDecimal(params.effectiveInvoiceAmount);
        const refunded = params.refunds
            .filter((refund) => !refund.isVoided)
            .reduce((sum, refund) => sum.add(Money.fromDecimal(refund.amount)), Money.zero());

        return Math.max(paid.subtract(effectiveInvoice).subtract(refunded).toDecimal(), 0);
    }

    calculateRefundStatus(params: {
        paidAmount: number;
        effectiveInvoiceAmount: number;
        refunds: readonly PaymentAmountInput[];
    }): RefundRequirementStatus {
        const paid = Money.fromDecimal(params.paidAmount);
        const effectiveInvoice = Money.fromDecimal(params.effectiveInvoiceAmount);
        const refundNeed = paid.subtract(effectiveInvoice);

        if (!refundNeed.isGreaterThan(Money.zero())) return "NO_REFUND_REQUIRED";

        const refunded = params.refunds
            .filter((refund) => !refund.isVoided)
            .reduce((sum, refund) => sum.add(Money.fromDecimal(refund.amount)), Money.zero());

        if (refunded.isZero()) return "REFUND_REQUIRED";
        if (refunded.isLessThan(refundNeed)) return "PARTIALLY_REFUNDED";
        if (refunded.cents === refundNeed.cents) return "FULLY_REFUNDED";

        return "OVER_REFUNDED";
    }

    assertRefundAmountAllowed(params: {
        requestedAmount: number;
        outstandingRefundAmount: number;
    }): void {
        if (
            Money.fromDecimal(params.requestedAmount).isGreaterThan(
                Money.fromDecimal(params.outstandingRefundAmount),
            )
        ) {
            throw new RefundAmountExceedsOutstandingAmountError();
        }
    }
}
