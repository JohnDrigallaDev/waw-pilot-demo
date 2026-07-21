export class InvoiceCorrectionDomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class InvoiceNotFoundError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Die Rechnung wurde nicht gefunden.");
    }
}

export class InvoiceAlreadyFullyCorrectedError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Diese Rechnung ist bereits vollständig korrigiert.");
    }
}

export class InvoiceNotFinalizedError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Nur finale Rechnungen können korrigiert werden.");
    }
}

export class ProformaCannotBeCancelledError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Pro-forma-Rechnungen werden zurückgezogen und nicht storniert.");
    }
}

export class CorrectionAmountExceedsRemainingAmountError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Der Korrekturbetrag überschreitet den verbleibenden korrigierbaren Betrag.");
    }
}

export class InvalidCorrectionReasonError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Bitte gib einen gültigen Korrekturgrund an.");
    }
}

export class RefundAmountExceedsOutstandingAmountError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Der Rückzahlungsbetrag überschreitet den offenen Rückzahlungsbedarf.");
    }
}

export class RefundNotAllowedError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Für diesen Verkauf ist aktuell keine Rückzahlung offen.");
    }
}

export class CrossTenantCorrectionError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Korrekturen dürfen nicht mandantenübergreifend erstellt werden.");
    }
}

export class CorrectionDocumentGenerationError extends InvoiceCorrectionDomainError {
    constructor() {
        super("Der Korrekturbeleg konnte nicht erzeugt werden.");
    }
}
