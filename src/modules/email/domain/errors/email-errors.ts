export class EmailDomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class InvalidEmailAddressError extends EmailDomainError {}
export class MissingRecipientError extends EmailDomainError {}
export class MissingEmailSubjectError extends EmailDomainError {}
export class MissingEmailBodyError extends EmailDomainError {}
export class EmailAttachmentNotFoundError extends EmailDomainError {}
export class EmailAttachmentAccessDeniedError extends EmailDomainError {}
export class EmailAttachmentTooLargeError extends EmailDomainError {}
export class EmailTotalSizeExceededError extends EmailDomainError {}
export class EmailTemplateVariableMissingError extends EmailDomainError {}
export class EmailAlreadySentError extends EmailDomainError {}
export class EmailSendInProgressError extends EmailDomainError {}
export class EmailRetryNotAllowedError extends EmailDomainError {}
export class EmailProviderUnavailableError extends EmailDomainError {}
export class CrossTenantEmailRelationError extends EmailDomainError {}
export class SenderConfigurationMissingError extends EmailDomainError {}
