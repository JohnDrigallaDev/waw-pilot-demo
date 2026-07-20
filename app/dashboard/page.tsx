export const dynamic = "force-dynamic";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardData } from "@/lib/dashboard/dashboard-queries";

type DashboardPageProps = {
    searchParams: Promise<{
        month?: string;
    }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const resolvedSearchParams = await searchParams;
    const data = await getDashboardData(resolvedSearchParams.month ?? null);

    return (
        <DashboardOverview
            data={data}
            monthFilter={resolvedSearchParams.month ?? null}
        />
    );
}
