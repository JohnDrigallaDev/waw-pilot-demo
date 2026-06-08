export const dynamic = "force-dynamic";

import { LicensePlatesOverview } from "@/components/license-plates/license-plates-overview";
import { getLicensePlateCases } from "@/lib/license-plates/license-plate-queries";

export default async function LicensePlatesPage() {
    const cases = await getLicensePlateCases();

    return <LicensePlatesOverview cases={cases} />;
}