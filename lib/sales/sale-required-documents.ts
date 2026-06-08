import type { SaleType } from "@/lib/sales/sale-queries";

export type RequiredDocumentDefinition = {
    documentType: string;
    label: string;
};

export type SaleDocumentInput = {
    document_type: string;
    status: "available" | "missing" | "needs_review";
};

const BASE_REQUIRED_DOCUMENTS: RequiredDocumentDefinition[] = [
    {
        documentType: "invoice",
        label: "Rechnung",
    },
    {
        documentType: "vehicle_registration",
        label: "Fahrzeugschein",
    },
    {
        documentType: "owner_id",
        label: "Ausweis Kunde",
    },
];

const COMPANY_REQUIRED_DOCUMENTS: RequiredDocumentDefinition[] = [
    {
        documentType: "commercial_register",
        label: "Handelsregisterauszug",
    },
];

const EU_REQUIRED_DOCUMENTS: RequiredDocumentDefinition[] = [
    {
        documentType: "entry_certificate",
        label: "Gelangensbestätigung",
    },
    {
        documentType: "transport_proof",
        label: "Verbringungsnachweis",
    },
    {
        documentType: "handover_protocol",
        label: "Übergabeprotokoll",
    },
];

const THIRD_COUNTRY_REQUIRED_DOCUMENTS: RequiredDocumentDefinition[] = [
    {
        documentType: "export_accompanying_document",
        label: "Ausfuhrbegleitdokument / ABD",
    },
    {
        documentType: "exit_note",
        label: "Ausgangsvermerk",
    },
    {
        documentType: "handover_protocol",
        label: "Übergabeprotokoll",
    },
];

export function getRequiredDocumentsForSale({
                                                saleType,
                                                isCompanyCustomer,
                                            }: {
    saleType: SaleType;
    isCompanyCustomer: boolean;
}): RequiredDocumentDefinition[] {
    const requiredDocuments = [...BASE_REQUIRED_DOCUMENTS];

    if (isCompanyCustomer) {
        requiredDocuments.push(...COMPANY_REQUIRED_DOCUMENTS);
    }

    if (saleType === "eu") {
        requiredDocuments.push(...EU_REQUIRED_DOCUMENTS);
    }

    if (saleType === "export_third_country") {
        requiredDocuments.push(...THIRD_COUNTRY_REQUIRED_DOCUMENTS);
    }

    return requiredDocuments;
}

export function evaluateRequiredDocuments({
                                              requiredDocuments,
                                              documents,
                                          }: {
    requiredDocuments: RequiredDocumentDefinition[];
    documents: SaleDocumentInput[];
}) {
    const availableDocumentTypes = new Set(
        documents
            .filter((document) => document.status === "available")
            .map((document) => document.document_type),
    );

    const missingDocuments = requiredDocuments.filter(
        (requiredDocument) =>
            !availableDocumentTypes.has(requiredDocument.documentType),
    );

    return {
        requiredCount: requiredDocuments.length,
        availableCount: requiredDocuments.length - missingDocuments.length,
        missingCount: missingDocuments.length,
        missingLabels: missingDocuments.map((document) => document.label),
        isComplete: missingDocuments.length === 0,
    };
}