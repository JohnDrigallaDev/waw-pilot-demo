import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CreateCancellationInvoiceUseCase } from "@/src/modules/invoice-corrections/application/use-cases/create-cancellation-invoice.use-case";
import { GetCorrectionEligibilityUseCase } from "@/src/modules/invoice-corrections/application/use-cases/get-correction-eligibility.use-case";
import { RegisterRefundUseCase } from "@/src/modules/invoice-corrections/application/use-cases/register-refund.use-case";
import { CorrectionActivityAdapter } from "@/src/modules/invoice-corrections/infrastructure/logging/correction-activity.adapter";
import { CorrectionFinancialJournalAdapter } from "@/src/modules/invoice-corrections/infrastructure/repositories/correction-financial-journal.adapter";
import { SupabaseInvoiceCorrectionRepository } from "@/src/modules/invoice-corrections/infrastructure/repositories/supabase-invoice-correction.repository";

export function createInvoiceCorrectionUseCases() {
    const supabase = createServerSupabaseClient();
    const repository = new SupabaseInvoiceCorrectionRepository(supabase);
    const financialJournal = new CorrectionFinancialJournalAdapter();
    const activity = new CorrectionActivityAdapter();

    return {
        getCorrectionEligibility: new GetCorrectionEligibilityUseCase(repository),
        createCancellationInvoice: new CreateCancellationInvoiceUseCase(
            repository,
            financialJournal,
            activity,
        ),
        registerRefund: new RegisterRefundUseCase(repository, financialJournal, activity),
        repository,
    };
}
