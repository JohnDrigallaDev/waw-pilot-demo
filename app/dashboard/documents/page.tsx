export const dynamic = "force-dynamic";

import { DocumentsOverview } from "@/components/documents/documents-overview";
import { getDocuments } from "@/lib/documents/document-queries";

export default async function DocumentsPage() {
    const documents = await getDocuments();

    return <DocumentsOverview documents={documents} />;
}