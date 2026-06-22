import { SaleDetail } from "@/components/sales/sale-detail";
import { getSaleGeneratedDocumentChecks } from "@/lib/pdf/generated-documents/sale-document-checks";
import { getSaleDetail } from "@/lib/sales/sale-detail-queries";
import { getSaleExportDetails } from "@/lib/sales/sale-export-details-queries";

type SaleDetailPageProps = {
    params: Promise<{
        saleId: string;
    }>;
    searchParams: Promise<{
        generatedDocument?: string;
        invoiceCreated?: string;
        invoiceRegenerated?: string;
        documentDeleted?: string;
        documentUploaded?: string;
        travelExpenseCreated?: string;
        exportDataSaved?: string;
        exportDataError?: string;
    }>;
};

export default async function SaleDetailPage({
                                                 params,
                                                 searchParams,
                                             }: SaleDetailPageProps) {
    const [{ saleId }, resolvedSearchParams] = await Promise.all([
        params,
        searchParams,
    ]);

    const [sale, generatedDocuments, exportDetails] = await Promise.all([
        getSaleDetail(saleId),
        getSaleGeneratedDocumentChecks(saleId),
        getSaleExportDetails(saleId),
    ]);

    return (
        <SaleDetail
            sale={sale}
            generatedDocuments={generatedDocuments}
            exportDetails={exportDetails}
            generatedDocumentType={resolvedSearchParams.generatedDocument ?? null}
            invoiceCreatedNumber={resolvedSearchParams.invoiceCreated ?? null}
            invoiceRegeneratedNumber={resolvedSearchParams.invoiceRegenerated ?? null}
            documentUploaded={resolvedSearchParams.documentUploaded === "1"}
            documentDeleted={resolvedSearchParams.documentDeleted === "1"}
            travelExpenseCreated={resolvedSearchParams.travelExpenseCreated === "1"}
            exportDataSaved={resolvedSearchParams.exportDataSaved === "1"}
            exportDataError={resolvedSearchParams.exportDataError === "1"}
        />
    );
}
