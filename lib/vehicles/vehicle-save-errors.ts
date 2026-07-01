const duplicateVinMessage =
    "Ein Fahrzeug mit dieser Fahrgestellnummer/VIN existiert bereits. Bitte prüfe die Eingabe oder öffne das bestehende Fahrzeug.";

const duplicateInternalNumberMessage =
    "Ein Fahrzeug mit dieser internen Nummer existiert bereits. Bitte wähle eine andere interne Nummer oder öffne das bestehende Fahrzeug.";

const duplicateVehicleMessage =
    "Dieses Fahrzeug existiert bereits. Bitte prüfe Fahrgestellnummer/VIN und interne Nummer.";

const genericVehicleSaveMessage =
    "Fahrzeug konnte nicht gespeichert werden. Bitte versuche es erneut.";

type DatabaseErrorLike = {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
    constraint?: string;
};

function getErrorText(error: unknown): string {
    if (!error || typeof error !== "object") return "";

    const databaseError = error as DatabaseErrorLike;

    return [
        databaseError.code,
        databaseError.message,
        databaseError.details,
        databaseError.hint,
        databaseError.constraint,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

export function translateVehicleDatabaseError(error: unknown): string {
    const errorText = getErrorText(error);
    const isDuplicateError =
        errorText.includes("23505") ||
        errorText.includes("duplicate key value") ||
        errorText.includes("violates unique constraint");

    if (!isDuplicateError) return genericVehicleSaveMessage;

    if (
        errorText.includes("vehicles_company_id_vin_key") ||
        errorText.includes("(company_id, vin)") ||
        errorText.includes("vin")
    ) {
        return duplicateVinMessage;
    }

    if (
        errorText.includes("vehicles_company_id_internal_number_key") ||
        errorText.includes("(company_id, internal_number)") ||
        errorText.includes("internal_number")
    ) {
        return duplicateInternalNumberMessage;
    }

    return duplicateVehicleMessage;
}

export function getDuplicateVinMessage(): string {
    return duplicateVinMessage;
}

export function getDuplicateInternalNumberMessage(): string {
    return duplicateInternalNumberMessage;
}
