import type { SaleType } from "@/lib/sales/sale-queries";
import { VatVerificationRequirementPolicy } from "@/src/modules/documents/domain/policies/vat-verification-requirement-policy";

export class GetVatVerificationRequirementUseCase {
    constructor(
        private readonly policy = new VatVerificationRequirementPolicy(),
    ) {}

    execute(params: {
        saleType: SaleType | string | null | undefined;
        buyerType: "company" | "private" | string | null | undefined;
    }): boolean {
        return this.policy.isRequired(params);
    }
}
