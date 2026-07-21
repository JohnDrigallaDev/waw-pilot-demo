import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getPurchaseCaseDetail } from "@/lib/purchases/purchase-detail-queries";
import { getPurchaseFormData } from "@/lib/purchases/purchase-form-data";

export const dynamic = "force-dynamic";

type EditPurchasePageProps = {
    params: Promise<{
        purchaseId: string;
    }>;
};

export default async function EditPurchasePage({ params }: EditPurchasePageProps) {
    const { purchaseId } = await params;

    const [purchase, formData] = await Promise.all([
        getPurchaseCaseDetail(purchaseId),
        getPurchaseFormData(),
    ]);

    return (
        <PurchaseForm
            mode="edit"
            formData={formData}
            initialValues={{
                id: purchase.id,
                vehicle_id: purchase.vehicle_id,
                seller_customer_id: purchase.seller_customer_id,
                purchase_date: purchase.purchase_date,
                net_amount: purchase.net_amount,
                vat_rate: purchase.vat_rate,
                payment_status: purchase.payment_status,
                notes: purchase.notes,
            }}
        />
    );
}
