export const dynamic = "force-dynamic";

import { CustomersOverview } from "@/components/customers/customers-overview";
import { getCustomers } from "@/lib/customers/customer-queries";

export default async function CustomersPage() {
    const customers = await getCustomers();

    return <CustomersOverview customers={customers} />;
}