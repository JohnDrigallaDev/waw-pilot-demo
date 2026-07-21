export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createDocumentUseCases } from "@/src/modules/documents/infrastructure/factories/document-use-case.factory";
import { DocumentDetailPage } from "@/src/modules/documents/presentation/components/document-detail-page";

type DocumentPageProps = {
    params: Promise<{
        documentId: string;
    }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
    const { documentId } = await params;
    const companyId = getCurrentCompanyId();
    const { getDocumentDetail } = createDocumentUseCases();
    let document;

    try {
        document = await getDocumentDetail.execute({
            companyId,
            documentId,
        });
    } catch {
        notFound();
    }

    return <DocumentDetailPage document={document} />;
}
