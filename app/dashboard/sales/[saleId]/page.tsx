import { SaleDetail } from "@/components/sales/sale-detail";
import { getSaleGeneratedDocumentChecks } from "@/lib/pdf/generated-documents/sale-document-checks";
import { getSaleDetail } from "@/lib/sales/sale-detail-queries";
import { getSaleExportDetails } from "@/lib/sales/sale-export-details-queries";
import { isZugferdServiceConfigured } from "@/lib/zugferd/zugferd-service-client";

type SaleDetailPageProps = {
    params: Promise<{
        saleId: string;
    }>;
    searchParams: Promise<{
        generatedDocument?: string;
        invoiceCreated?: string;
        invoiceRegenerated?: string;
        invoiceEmailSent?: string;
        invoiceEmailError?: string;
        zugferdCreated?: string;
        zugferdEmailSent?: string;
        zugferdError?: string;
        zugferdMissing?: string;
        highlightInvoiceId?: string;
        documentDeleted?: string;
        documentUploaded?: string;
        travelExpenseCreated?: string;
        exportDataSaved?: string;
        exportDataError?: string;
        exportArrivalError?: string;
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
            isZugferdServiceConfigured={isZugferdServiceConfigured()}
            generatedDocumentType={resolvedSearchParams.generatedDocument ?? null}
            invoiceCreatedNumber={resolvedSearchParams.invoiceCreated ?? null}
            invoiceRegeneratedNumber={resolvedSearchParams.invoiceRegenerated ?? null}
            invoiceEmailSent={resolvedSearchParams.invoiceEmailSent ?? null}
            invoiceEmailError={resolvedSearchParams.invoiceEmailError ?? null}
            zugferdCreated={resolvedSearchParams.zugferdCreated === "1"}
            zugferdEmailSent={resolvedSearchParams.zugferdEmailSent ?? null}
            zugferdError={resolvedSearchParams.zugferdError ?? null}
            zugferdMissingFields={
                resolvedSearchParams.zugferdMissing
                    ? resolvedSearchParams.zugferdMissing.split("|").filter(Boolean)
                    : []
            }
            highlightInvoiceId={resolvedSearchParams.highlightInvoiceId ?? null}
            documentUploaded={resolvedSearchParams.documentUploaded === "1"}
            documentDeleted={resolvedSearchParams.documentDeleted === "1"}
            travelExpenseCreated={resolvedSearchParams.travelExpenseCreated === "1"}
            exportDataSaved={resolvedSearchParams.exportDataSaved === "1"}
            exportDataError={resolvedSearchParams.exportDataError === "1"}
            exportArrivalError={resolvedSearchParams.exportArrivalError === "1"}
        />
    );
}
