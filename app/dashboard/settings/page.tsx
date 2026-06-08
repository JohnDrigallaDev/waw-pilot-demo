export const dynamic = "force-dynamic";

import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { getCompanySettings } from "@/lib/settings/company-settings-queries";

export default async function SettingsPage() {
    const company = await getCompanySettings();

    return <CompanySettingsForm company={company} />;
}