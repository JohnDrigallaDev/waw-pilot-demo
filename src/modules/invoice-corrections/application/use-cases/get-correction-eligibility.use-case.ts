import type { InvoiceCorrectionRepository } from "@/src/modules/invoice-corrections/application/ports/invoice-correction-repository.port";
import type { GetCorrectionEligibilityQuery } from "@/src/modules/invoice-corrections/application/queries/get-correction-eligibility.query";
import { InvoiceNotFoundError } from "@/src/modules/invoice-corrections/domain/errors/invoice-correction-errors";

export class GetCorrectionEligibilityUseCase {
    constructor(private readonly corrections: InvoiceCorrectionRepository) {}

    async execute(query: GetCorrectionEligibilityQuery) {
        const summary = await this.corrections.getCorrectionSummary(query);

        if (!summary) {
            throw new InvoiceNotFoundError();
        }

        return summary;
    }
}
