export class DocumentDomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class DocumentNotFoundError extends DocumentDomainError {
    constructor() {
        super("Das Dokument wurde nicht gefunden.");
    }
}

export class DocumentAccessDeniedError extends DocumentDomainError {
    constructor() {
        super("Sie haben keine Berechtigung für diese Dokumentaktion.");
    }
}

export class DocumentTypeNotAllowedError extends DocumentDomainError {
    constructor() {
        super("Dieser Dokumenttyp ist für diese Verknüpfung nicht zulässig.");
    }
}

export class DocumentReplacementNotAllowedError extends DocumentDomainError {
    constructor() {
        super("Dieses Dokument darf nicht ersetzt werden.");
    }
}

export class DuplicateDocumentVersionError extends DocumentDomainError {
    constructor() {
        super("Diese Datei entspricht der bereits aktiven Version.");
    }
}

export class InvalidMimeTypeError extends DocumentDomainError {
    constructor(mimeType: string) {
        super(`Der Dateityp ${mimeType || "unbekannt"} wird nicht unterstützt.`);
    }
}

export class FileTooLargeError extends DocumentDomainError {
    constructor(readonly maxBytes: number) {
        super("Die Datei ist zu groß.");
    }
}

export class InvalidFileSizeError extends DocumentDomainError {
    constructor() {
        super("Die Datei ist leer oder beschädigt.");
    }
}

export class InvalidFileNameError extends DocumentDomainError {
    constructor() {
        super("Der Dateiname ist ungültig.");
    }
}

export class CrossTenantRelationError extends DocumentDomainError {
    constructor() {
        super("Dokumente dürfen nicht mandantenübergreifend verknüpft werden.");
    }
}

export class DocumentAlreadyArchivedError extends DocumentDomainError {
    constructor() {
        super("Das Dokument ist bereits archiviert.");
    }
}

export class ActiveVersionMissingError extends DocumentDomainError {
    constructor() {
        super("Für dieses Dokument ist keine aktive Version vorhanden.");
    }
}
