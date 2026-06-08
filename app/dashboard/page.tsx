export const dynamic = "force-dynamic";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardData } from "@/lib/dashboard/dashboard-queries";

export default async function DashboardPage() {
    const data = await getDashboardData();

    return <DashboardOverview data={data} />;
}