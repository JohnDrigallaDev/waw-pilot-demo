export const dynamic = "force-dynamic";

import { CustomersOverview } from "@/components/customers/customers-overview";
import { getCustomers } from "@/lib/customers/customer-queries";

type CustomersPageProps = {
    searchParams: Promise<{
        customerSaved?: string;
    }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
    const resolvedSearchParams = await searchParams;
    const customers = await getCustomers();

    return (
        <CustomersOverview
            customers={customers}
            customerSaved={resolvedSearchParams.customerSaved === "1"}
        />
    );
}
