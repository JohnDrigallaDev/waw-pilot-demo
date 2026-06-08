export const dynamic = "force-dynamic";

import { SalesOverview } from "@/components/sales/sales-overview";
import { getSales } from "@/lib/sales/sale-queries";

export default async function SalesPage() {
    const sales = await getSales();

    return <SalesOverview sales={sales} />;
}