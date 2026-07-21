import type { SaleType } from "@/lib/sales/sale-queries";

export type BuyerType = "company" | "private";

export class VatVerificationRequirementPolicy {
    isRequired(params: {
        saleType: SaleType | string | null | undefined;
        buyerType: BuyerType | string | null | undefined;
    }): boolean {
        return params.saleType === "eu" && params.buyerType === "company";
    }
}
