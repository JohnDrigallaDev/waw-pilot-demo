export const dynamic = "force-dynamic";

import { DocumentsOverview } from "@/components/documents/documents-overview";
import { getDocuments } from "@/lib/documents/document-queries";

type DocumentsPageProps = {
    searchParams: Promise<{
        filter?: string;
        status?: string;
        vehicleId?: string;
    }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
    const resolvedSearchParams = await searchParams;
    const documents = await getDocuments();

    return (
        <DocumentsOverview
            documents={documents}
            initialFilter={resolvedSearchParams.filter ?? resolvedSearchParams.status ?? null}
            initialVehicleId={resolvedSearchParams.vehicleId ?? null}
        />
    );
}
