import type { DocumentDetailDto } from "@/src/modules/documents/application/dto/document.dto";

export type DocumentRelationViewModel = {
    label: string;
    href: string | null;
};

export type DocumentVersionViewModel = {
    id: string;
    label: string;
    fileName: string;
    uploadedAt: string;
    isActive: boolean;
    openHref: string;
    downloadHref: string;
};

function getRelationLabel(type: string): string {
    const labels: Record<string, string> = {
        VEHICLE: "Fahrzeug",
        SALE: "Verkauf",
        PURCHASE: "Ankauf",
        CUSTOMER: "Kunde",
        PARTNER: "Geschäftspartner",
        INVOICE: "Rechnung",
        PAYMENT: "Zahlung",
        FINANCIAL_ENTRY: "Finanzvorgang",
        EXPORT_BATCH: "Export",
        LICENSE_PLATE_CASE: "Kennzeichen",
    };

    return labels[type] ?? type;
}

function getRelationHref(type: string, id: string): string | null {
    const hrefs: Record<string, string> = {
        VEHICLE: `/dashboard/vehicles/${id}`,
        SALE: `/dashboard/sales/${id}`,
        PURCHASE: `/dashboard/ankauf/${id}`,
        CUSTOMER: `/dashboard/customers/${id}`,
        PARTNER: `/dashboard/customers/${id}`,
        INVOICE: `/dashboard/invoices/${id}`,
        FINANCIAL_ENTRY: `/dashboard/cashbook/accounting?entryId=${id}`,
        LICENSE_PLATE_CASE: `/dashboard/plates/${id}`,
    };

    return hrefs[type] ?? null;
}

export function createDocumentDetailViewModel(document: DocumentDetailDto) {
    return {
        id: document.id,
        reference: document.documentReference,
        title: document.title,
        typeLabel: document.documentTypeLabel,
        status: document.status,
        archiveStatus: document.archiveStatus,
        fileName: document.fileName,
        mimeType: document.mimeType ?? "Dateityp unbekannt",
        fileSizeBytes: document.fileSizeBytes,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        description: document.description,
        openHref: `/api/documents/${document.id}/file`,
        downloadHref: `/api/documents/${document.id}/file?download=1`,
        relations: document.relations.map<DocumentRelationViewModel>((relation) => ({
            label: `${getRelationLabel(relation.relationType)} ${relation.relationId.slice(0, 8)}`,
            href: getRelationHref(relation.relationType, relation.relationId),
        })),
        versions: document.versions
            .slice()
            .sort((a, b) => b.versionNumber - a.versionNumber)
            .map<DocumentVersionViewModel>((version) => ({
                id: version.id,
                label: `Version ${version.versionNumber}`,
                fileName: version.originalFileName,
                uploadedAt: version.uploadedAt,
                isActive: version.isActive,
                openHref: `/api/documents/${document.id}/file?versionId=${version.id}`,
                downloadHref: `/api/documents/${document.id}/file?versionId=${version.id}&download=1`,
            })),
    };
}
