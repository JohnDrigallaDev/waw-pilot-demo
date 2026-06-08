export const dynamic = "force-dynamic";

import { ChecksOverview } from "@/components/checks/checks-overview";
import { getChecksData } from "@/lib/checks/checks-queries";

export default async function ChecksPage() {
    const data = await getChecksData();

    return <ChecksOverview data={data} />;
}