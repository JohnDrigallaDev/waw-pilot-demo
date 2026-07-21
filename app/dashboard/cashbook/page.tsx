export const dynamic = "force-dynamic";

import { FinancialOverview } from "@/components/cashbook/financial-overview";
import {
    getCashRegisterSummary,
    getFinancialEntries,
} from "@/lib/accounting/financial-queries";

type CashbookPageProps = {
    searchParams: Promise<{
        from?: string;
        to?: string;
        tab?: string;
    }>;
};

function normalizeDateParam(value: string | undefined): string | null {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function CashbookPage({ searchParams }: CashbookPageProps) {
    const resolvedSearchParams = await searchParams;
    const dateFrom = normalizeDateParam(resolvedSearchParams.from);
    const dateTo = normalizeDateParam(resolvedSearchParams.to);
    const activeTab =
        resolvedSearchParams.tab === "accounting" ? "accounting" : "cash";
    const entries = await getFinancialEntries({
        from: dateFrom,
        to: dateTo,
    });
    const cashSummary = await getCashRegisterSummary(entries);

    return (
        <FinancialOverview
            entries={entries}
            cashSummary={cashSummary}
            activeTab={activeTab}
            dateFrom={dateFrom}
            dateTo={dateTo}
        />
    );
}
