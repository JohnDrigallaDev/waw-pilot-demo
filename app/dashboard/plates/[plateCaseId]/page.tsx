import { LicensePlateDetail } from "@/components/license-plates/license-plate-detail";
import { getLicensePlateCaseDetail } from "@/lib/license-plates/license-plate-detail-queries";

type LicensePlateDetailPageProps = {
    params: Promise<{
        plateCaseId: string;
    }>;
    searchParams: Promise<{
        generatedDocument?: string;
    }>;
};

export default async function LicensePlateDetailPage({
                                                         params,
                                                         searchParams,
                                                     }: LicensePlateDetailPageProps) {
    const [{ plateCaseId }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);

    const plateCase = await getLicensePlateCaseDetail(plateCaseId);

    return (
        <LicensePlateDetail
            plateCase={plateCase}
            generatedDocumentType={resolvedSearchParams.generatedDocument ?? null}
        />
    );
}