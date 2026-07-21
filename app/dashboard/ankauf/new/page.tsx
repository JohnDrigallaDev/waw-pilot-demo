import { PurchaseForm } from "@/components/purchases/purchase-form";
import { getPurchaseFormData } from "@/lib/purchases/purchase-form-data";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
    const formData = await getPurchaseFormData();

    return <PurchaseForm formData={formData} />;
}
