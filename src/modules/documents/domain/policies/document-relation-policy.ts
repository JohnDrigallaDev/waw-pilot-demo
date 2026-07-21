import type { DocumentRelationType } from "@/src/modules/documents/domain/constants/document-types";
import { getDocumentTypeDefinition } from "@/src/modules/documents/domain/constants/document-types";
import {
    CrossTenantRelationError,
    DocumentTypeNotAllowedError,
} from "@/src/modules/documents/domain/errors/document-errors";

export class DocumentRelationPolicy {
    assertRelationAllowed(params: {
        documentType: string;
        relationType: DocumentRelationType;
        documentCompanyId: string;
        relationCompanyId: string;
    }): void {
        if (params.documentCompanyId !== params.relationCompanyId) {
            throw new CrossTenantRelationError();
        }

        const definition = getDocumentTypeDefinition(params.documentType);

        if (!definition.allowedRelations.includes(params.relationType)) {
            throw new DocumentTypeNotAllowedError();
        }
    }
}
