export type RequiredDocumentDefinition = {
    documentType: string;
    label: string;
    acceptedDocumentTypes?: readonly string[];
};

export type RequirementDocumentInput = {
    documentType: string;
    status: "ACTIVE" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED" | "ARCHIVED" | "ERROR";
    archiveStatus: "ACTIVE" | "ARCHIVED";
};

export class DocumentRequirementService {
    evaluate(params: {
        requiredDocuments: readonly RequiredDocumentDefinition[];
        documents: readonly RequirementDocumentInput[];
    }) {
        const activeDocumentTypes = new Set(
            params.documents
                .filter(
                    (document) =>
                        document.archiveStatus === "ACTIVE" &&
                        (document.status === "ACTIVE" || document.status === "APPROVED"),
                )
                .map((document) => document.documentType),
        );

        const reviewDocumentTypes = new Set(
            params.documents
                .filter(
                    (document) =>
                        document.archiveStatus === "ACTIVE" &&
                        (document.status === "REVIEW_REQUIRED" ||
                            document.status === "REJECTED" ||
                            document.status === "ERROR"),
                )
                .map((document) => document.documentType),
        );

        const missing = params.requiredDocuments.filter((requiredDocument) => {
            const acceptedTypes = requiredDocument.acceptedDocumentTypes ?? [
                requiredDocument.documentType,
            ];

            return !acceptedTypes.some((documentType) => activeDocumentTypes.has(documentType));
        });

        const reviewRequired = params.requiredDocuments.filter((requiredDocument) => {
            const acceptedTypes = requiredDocument.acceptedDocumentTypes ?? [
                requiredDocument.documentType,
            ];

            return acceptedTypes.some((documentType) => reviewDocumentTypes.has(documentType));
        });

        return {
            requiredCount: params.requiredDocuments.length,
            availableCount: params.requiredDocuments.length - missing.length,
            missingCount: missing.length,
            missingLabels: missing.map((document) => document.label),
            reviewRequiredCount: reviewRequired.length,
            reviewRequiredLabels: reviewRequired.map((document) => document.label),
            isComplete: missing.length === 0,
        };
    }
}
