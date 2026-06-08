import { PurchaseDetail } from "@/components/purchases/purchase-detail";
import { getPurchaseCaseDetail } from "@/lib/purchases/purchase-detail-queries";

type PurchaseDetailPageProps = {
    params: Promise<{
        purchaseId: string;
    }>;
};

export default async function PurchaseDetailPage({
                                                     params,
                                                 }: PurchaseDetailPageProps) {
    const { purchaseId } = await params;

    const purchase = await getPurchaseCaseDetail(purchaseId);

    return <PurchaseDetail purchase={purchase} />;
}