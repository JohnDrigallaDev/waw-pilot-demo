import { ReportsOverview } from "@/components/reports/reports-overview";
import {
    getReportsData,
    parseReportsFilters,
} from "@/lib/reports/report-queries";

type ReportsPageProps = {
    searchParams: Promise<{
        period?: string;
        date_from?: string;
        date_to?: string;
    }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
    const resolvedSearchParams = await searchParams;
    const filters = parseReportsFilters(resolvedSearchParams);

    const data = await getReportsData(filters);

    return <ReportsOverview data={data} />;
}