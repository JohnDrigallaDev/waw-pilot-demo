import { CashbookOverview } from "@/components/cashbook/cashbook-overview";
import { getCashbookEntries } from "@/lib/cashbook/cashbook-queries";

export default async function CashbookPage() {
    const entries = await getCashbookEntries();

    return <CashbookOverview entries={entries} />;
}