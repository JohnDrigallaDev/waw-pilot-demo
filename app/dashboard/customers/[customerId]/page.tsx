import { CustomerDetail } from "@/components/customers/customer-detail";
import { getCustomerDetail } from "@/lib/customers/customer-detail-queries";

type CustomerDetailPageProps = {
    params: Promise<{
        customerId: string;
    }>;
};

export default async function CustomerDetailPage({
                                                     params,
                                                 }: CustomerDetailPageProps) {
    const { customerId } = await params;
    const customer = await getCustomerDetail(customerId);

    return <CustomerDetail customer={customer} />;
}