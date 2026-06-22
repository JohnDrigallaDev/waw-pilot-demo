import { CustomerDetail } from "@/components/customers/customer-detail";
import { getCustomerDetail } from "@/lib/customers/customer-detail-queries";

type CustomerDetailPageProps = {
    params: Promise<{
        customerId: string;
    }>;
    searchParams: Promise<{
        customerSaved?: string;
    }>;
};

export default async function CustomerDetailPage({
                                                     params,
                                                     searchParams,
                                                 }: CustomerDetailPageProps) {
    const [{ customerId }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);
    const customer = await getCustomerDetail(customerId);

    return (
        <CustomerDetail
            customer={customer}
            customerSaved={resolvedSearchParams.customerSaved === "1"}
        />
    );
}
