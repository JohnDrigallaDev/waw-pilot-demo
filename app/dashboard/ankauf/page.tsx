export const dynamic = "force-dynamic";

import { PurchasesOverview } from "@/components/purchases/purchases-overview";
import { getPurchaseCases } from "@/lib/purchases/purchase-queries";

export default async function PurchasesPage() {
    const purchases = await getPurchaseCases();

    return <PurchasesOverview purchases={purchases} />;
}