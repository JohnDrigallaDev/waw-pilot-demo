export class MissingInvoiceDateError extends Error {
    constructor() {
        super("Die Übergabebestätigung kann nicht erstellt werden, da kein Rechnungsdatum vorhanden ist.");
        this.name = "MissingInvoiceDateError";
    }
}

export class UnsupportedDestinationCountryError extends Error {
    constructor() {
        super("Für dieses Zielland ist kein automatischer Datumsvorschlag verfügbar.");
        this.name = "UnsupportedDestinationCountryError";
    }
}

export class MissingDocumentDateError extends Error {
    constructor() {
        super("Bitte gib ein Dokumentdatum ein.");
        this.name = "MissingDocumentDateError";
    }
}
