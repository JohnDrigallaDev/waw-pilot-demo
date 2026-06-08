import {
    generatedDocumentDefinitions,
    getGeneratedDocumentsByContext,
    type GeneratedDocumentDefinition,
    type GeneratedDocumentStatus,
    type GeneratedDocumentType,
} from "@/lib/pdf/generated-documents/document-types";
import {
    validateGeneratedDocumentData,
    type GeneratedDocumentValidationResult,
} from "@/lib/pdf/generated-documents/document-validation";
import {
    getGeneratedDocumentStatus,
    getGeneratedDocumentStatusLabel,
    getGeneratedDocumentStatusTone,
} from "@/lib/pdf/generated-documents/document-status";
import { getSaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";
import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SaleGeneratedDocumentCheck = {
    type: GeneratedDocumentType;
    documentType: string;
    label: string;
    description: string;
    requiresSignature: boolean;

    customerId: string | null;
    vehicleId: string | null;

    status: GeneratedDocumentStatus;
    statusLabel: string;
    statusTone: "success" | "warning" | "danger" | "info";

    canGenerate: boolean;
    missingFields: {
        field: string;
        label: string;
        message: string;
    }[];

    generatedDocument: {
        id: string;
        fileName: string;
        filePath: string | null;
        status: string;
        source: string;
    } | null;

    signedDocument: {
        id: string;
        fileName: string;
        filePath: string | null;
        status: string;
        source: string;
    } | null;
};

type DocumentRow = {
    id: string;
    document_type: string;
    source: string;
    status: string;
    file_name: string;
    file_path: string | null;
    created_at: string;
};

const saleGeneratedDocumentTypes = new Set<GeneratedDocumentType>([
    "invoice_pdf",
    "proforma_invoice",
    "handover_protocol",
    "entry_certificate",
    "transport_proof",
]);

function getDefinitionForSaleDocuments(): GeneratedDocumentDefinition[] {
    return generatedDocumentDefinitions.filter(
        (definition) =>
            definition.context === "sale" &&
            saleGeneratedDocumentTypes.has(definition.type),
    );
}

function getGeneratedDocument(
    documents: DocumentRow[],
    documentType: string,
): DocumentRow | null {
    return (
        documents.find(
            (document) =>
                document.document_type === documentType &&
                document.source === "generated",
        ) ?? null
    );
}

function getSignedDocument(
    documents: DocumentRow[],
    documentType: string,
): DocumentRow | null {
    return (
        documents.find(
            (document) =>
                document.document_type === documentType &&
                document.source === "uploaded" &&
                document.status === "available",
        ) ?? null
    );
}

function mapDocumentRow(document: DocumentRow | null) {
    if (!document) return null;

    return {
        id: document.id,
        fileName: document.file_name,
        filePath: document.file_path,
        status: document.status,
        source: document.source,
    };
}

export async function getSaleGeneratedDocumentChecks(
    saleId: string,
): Promise<SaleGeneratedDocumentCheck[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const [documentData, documentsResult] = await Promise.all([
        getSaleGeneratedDocumentData(saleId),

        supabase
            .from("documents")
            .select(
                `
                id,
                document_type,
                source,
                status,
                file_name,
                file_path,
                created_at
            `,
            )
            .eq("company_id", companyId)
            .eq("sale_id", saleId)
            .order("created_at", { ascending: false }),
    ]);

    if (documentsResult.error) {
        throw new Error(
            `Dokumentstatus konnte nicht geladen werden: ${documentsResult.error.message}`,
        );
    }

    const documents = (documentsResult.data ?? []) as DocumentRow[];
    const definitions = getDefinitionForSaleDocuments();

    return definitions.map((definition) => {
        const validation: GeneratedDocumentValidationResult =
            validateGeneratedDocumentData(definition.type, documentData);

        const generatedDocument = getGeneratedDocument(
            documents,
            definition.documentType,
        );

        const signedDocument = getSignedDocument(
            documents,
            definition.documentType,
        );

        const status = getGeneratedDocumentStatus({
            definition,
            validation,
            documentExists: Boolean(generatedDocument),
            signedDocumentExists: Boolean(signedDocument),
            sentToCustomer: false,
        });

        return {
            type: definition.type,
            documentType: definition.documentType,
            label: definition.label,
            description: definition.description,
            requiresSignature: definition.requiresSignature,

            customerId: documentData.customerId ?? null,
            vehicleId: documentData.vehicleId ?? null,

            status,
            statusLabel: getGeneratedDocumentStatusLabel(status),
            statusTone: getGeneratedDocumentStatusTone(status),

            canGenerate: validation.canGenerate,
            missingFields: validation.missingFields.map((field) => ({
                field: field.field,
                label: field.label,
                message: field.message,
            })),

            generatedDocument: mapDocumentRow(generatedDocument),
            signedDocument: mapDocumentRow(signedDocument),
        };
    });
}

export function getSaleGeneratedDocumentDefinitions() {
    return getGeneratedDocumentsByContext("sale").filter((definition) =>
        saleGeneratedDocumentTypes.has(definition.type),
    );
}