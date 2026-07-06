export const dynamic = "force-dynamic";

import { CashbookOverview } from "@/components/cashbook/cashbook-overview";
import { getCashbookEntries } from "@/lib/cashbook/cashbook-queries";

type CashbookPageProps = {
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>;
};

function normalizeDateParam(value: string | undefined): string | null {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function CashbookPage({ searchParams }: CashbookPageProps) {
    const resolvedSearchParams = await searchParams;
    const dateFrom = normalizeDateParam(resolvedSearchParams.from);
    const dateTo = normalizeDateParam(resolvedSearchParams.to);
    const entries = await getCashbookEntries({
        from: dateFrom,
        to: dateTo,
    });

    return (
        <CashbookOverview
            entries={entries}
            dateFrom={dateFrom}
            dateTo={dateTo}
        />
    );
}
