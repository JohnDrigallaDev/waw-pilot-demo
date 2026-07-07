export const dynamic = "force-dynamic";

import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { getCompanySettings } from "@/lib/settings/company-settings-queries";

type SettingsPageProps = {
    searchParams: Promise<{
        signatureUploaded?: string;
        stampUploaded?: string;
        assetUploadError?: string;
    }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
    const [company, resolvedSearchParams] = await Promise.all([
        getCompanySettings(),
        searchParams,
    ]);

    return (
        <CompanySettingsForm
            company={company}
            signatureUploaded={resolvedSearchParams.signatureUploaded === "1"}
            stampUploaded={resolvedSearchParams.stampUploaded === "1"}
            assetUploadError={resolvedSearchParams.assetUploadError}
        />
    );
}
