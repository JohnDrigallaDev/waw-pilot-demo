export const EMAIL_LANGUAGE_OPTIONS = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "Englisch" },
    { value: "sq", label: "Albanisch" },
    { value: "ar", label: "Arabisch" },
    { value: "be", label: "Belarussisch" },
    { value: "bs", label: "Bosnisch" },
    { value: "bg", label: "Bulgarisch" },
    { value: "ca", label: "Katalanisch" },
    { value: "hr", label: "Kroatisch" },
    { value: "da", label: "Dänisch" },
    { value: "et", label: "Estnisch" },
    { value: "fi", label: "Finnisch" },
    { value: "fr", label: "Französisch" },
    { value: "el", label: "Griechisch" },
    { value: "ga", label: "Irisch" },
    { value: "is", label: "Isländisch" },
    { value: "it", label: "Italienisch" },
    { value: "lv", label: "Lettisch" },
    { value: "lt", label: "Litauisch" },
    { value: "lb", label: "Luxemburgisch" },
    { value: "mk", label: "Mazedonisch" },
    { value: "mt", label: "Maltesisch" },
    { value: "nl", label: "Niederländisch" },
    { value: "no", label: "Norwegisch" },
    { value: "pl", label: "Polnisch" },
    { value: "pt", label: "Portugiesisch" },
    { value: "ro", label: "Rumänisch" },
    { value: "ru", label: "Russisch" },
    { value: "sr", label: "Serbisch" },
    { value: "sk", label: "Slowakisch" },
    { value: "sl", label: "Slowenisch" },
    { value: "es", label: "Spanisch" },
    { value: "sv", label: "Schwedisch" },
    { value: "cs", label: "Tschechisch" },
    { value: "tr", label: "Türkisch" },
    { value: "uk", label: "Ukrainisch" },
    { value: "hu", label: "Ungarisch" },
] as const;

export type EmailLanguage = (typeof EMAIL_LANGUAGE_OPTIONS)[number]["value"];

const EMAIL_LANGUAGE_VALUES = new Set<string>(
    EMAIL_LANGUAGE_OPTIONS.map((option) => option.value),
);

export function normalizeEmailLanguage(
    language: string | null | undefined,
    fallback: EmailLanguage = "de",
): EmailLanguage {
    if (language && EMAIL_LANGUAGE_VALUES.has(language)) {
        return language as EmailLanguage;
    }

    return fallback;
}

export function getEmailLanguageLabel(
    language: string | null | undefined,
): string {
    const normalizedLanguage = normalizeEmailLanguage(language);

    return (
        EMAIL_LANGUAGE_OPTIONS.find((option) => option.value === normalizedLanguage)
            ?.label ?? "Deutsch"
    );
}

function normalizeCountryText(value: string | null | undefined): string {
    return (value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
}

export function getSuggestedEmailLanguage({
                                              countryCode,
                                              country,
                                              preferredLanguage,
                                              selectedLanguage,
                                          }: {
    countryCode?: string | null;
    country?: string | null;
    preferredLanguage?: string | null;
    selectedLanguage?: string | null;
}): EmailLanguage {
    if (selectedLanguage && EMAIL_LANGUAGE_VALUES.has(selectedLanguage)) {
        return selectedLanguage as EmailLanguage;
    }

    if (preferredLanguage && EMAIL_LANGUAGE_VALUES.has(preferredLanguage)) {
        return preferredLanguage as EmailLanguage;
    }

    const normalizedCountryCode = countryCode?.trim().toLowerCase();
    const normalizedCountry = normalizeCountryText(country);

    if (
        normalizedCountryCode === "de" ||
        normalizedCountryCode === "at" ||
        normalizedCountryCode === "ch" ||
        normalizedCountry === "deutschland" ||
        normalizedCountry === "germany" ||
        normalizedCountry === "osterreich" ||
        normalizedCountry === "austria" ||
        normalizedCountry === "schweiz" ||
        normalizedCountry === "switzerland"
    ) {
        return "de";
    }

    if (normalizedCountryCode === "pl" || normalizedCountry === "polen" || normalizedCountry === "poland") {
        return "pl";
    }

    if (
        normalizedCountryCode === "bg" ||
        normalizedCountry === "bulgarien" ||
        normalizedCountry === "bulgaria"
    ) {
        return "bg";
    }

    return "en";
}
