import { correctionReasonDefinitions } from "@/src/modules/invoice-corrections/domain/constants/correction-types";
import {
    InvalidCorrectionReasonError,
    InvoiceAlreadyFullyCorrectedError,
    InvoiceNotFinalizedError,
    ProformaCannotBeCancelledError,
} from "@/src/modules/invoice-corrections/domain/errors/invoice-correction-errors";

export class CorrectionPolicy {
    assertCancellationAllowed(params: {
        invoiceType: string;
        invoiceStatus: string;
        remainingCorrectableAmount: number;
    }): void {
        if (params.invoiceType === "proforma") {
            throw new ProformaCannotBeCancelledError();
        }

        if (params.invoiceStatus === "draft") {
            throw new InvoiceNotFinalizedError();
        }

        if (params.remainingCorrectableAmount <= 0) {
            throw new InvoiceAlreadyFullyCorrectedError();
        }
    }

    assertReasonValid(reasonCode: string, reasonText: string | null): void {
        const reason = correctionReasonDefinitions.find((item) => item.code === reasonCode);

        if (!reason) throw new InvalidCorrectionReasonError();

        if (reason.requiresText && !reasonText?.trim()) {
            throw new InvalidCorrectionReasonError();
        }
    }
}
