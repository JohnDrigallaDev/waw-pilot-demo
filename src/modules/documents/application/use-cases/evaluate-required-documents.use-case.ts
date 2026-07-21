import {
    DocumentRequirementService,
    type RequiredDocumentDefinition,
    type RequirementDocumentInput,
} from "@/src/modules/documents/domain/services/document-requirement-service";

export class EvaluateRequiredDocumentsUseCase {
    private readonly requirementService = new DocumentRequirementService();

    execute(params: {
        requiredDocuments: readonly RequiredDocumentDefinition[];
        documents: readonly RequirementDocumentInput[];
    }) {
        return this.requirementService.evaluate(params);
    }
}
