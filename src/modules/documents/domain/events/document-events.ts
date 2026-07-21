export type DocumentDomainEvent =
    | {
          type: "DOCUMENT_CREATED";
          documentId: string;
          companyId: string;
      }
    | {
          type: "DOCUMENT_VERSION_ADDED";
          documentId: string;
          versionId: string;
          companyId: string;
      }
    | {
          type: "DOCUMENT_ARCHIVED";
          documentId: string;
          companyId: string;
          reason: string;
      }
    | {
          type: "DOCUMENT_LINKED";
          documentId: string;
          companyId: string;
          relationType: string;
          relationId: string;
      };
