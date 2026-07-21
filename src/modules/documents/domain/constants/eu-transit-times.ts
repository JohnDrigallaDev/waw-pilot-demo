export type EuCountryCode =
    | "AT"
    | "BE"
    | "BG"
    | "CY"
    | "CZ"
    | "DE"
    | "DK"
    | "EE"
    | "ES"
    | "FI"
    | "FR"
    | "GR"
    | "HR"
    | "HU"
    | "IE"
    | "IT"
    | "LT"
    | "LU"
    | "LV"
    | "MT"
    | "NL"
    | "PL"
    | "PT"
    | "RO"
    | "SE"
    | "SI"
    | "SK";

export type EuTransitTimeDefinition = {
    countryCode: EuCountryCode;
    countryName: string;
    calendarDays: number;
};

export const euTransitTimeDefinitions: readonly EuTransitTimeDefinition[] = [
    { countryCode: "DE", countryName: "Deutschland", calendarDays: 0 },
    { countryCode: "BE", countryName: "Belgien", calendarDays: 2 },
    { countryCode: "BG", countryName: "Bulgarien", calendarDays: 6 },
    { countryCode: "DK", countryName: "Dänemark", calendarDays: 2 },
    { countryCode: "EE", countryName: "Estland", calendarDays: 5 },
    { countryCode: "FI", countryName: "Finnland", calendarDays: 5 },
    { countryCode: "FR", countryName: "Frankreich", calendarDays: 4 },
    { countryCode: "GR", countryName: "Griechenland", calendarDays: 7 },
    { countryCode: "IE", countryName: "Irland", calendarDays: 6 },
    { countryCode: "IT", countryName: "Italien", calendarDays: 5 },
    { countryCode: "HR", countryName: "Kroatien", calendarDays: 6 },
    { countryCode: "LV", countryName: "Lettland", calendarDays: 5 },
    { countryCode: "LT", countryName: "Litauen", calendarDays: 4 },
    { countryCode: "LU", countryName: "Luxemburg", calendarDays: 2 },
    { countryCode: "MT", countryName: "Malta", calendarDays: 8 },
    { countryCode: "NL", countryName: "Niederlande", calendarDays: 2 },
    { countryCode: "AT", countryName: "Österreich", calendarDays: 3 },
    { countryCode: "PL", countryName: "Polen", calendarDays: 2 },
    { countryCode: "PT", countryName: "Portugal", calendarDays: 7 },
    { countryCode: "RO", countryName: "Rumänien", calendarDays: 6 },
    { countryCode: "SE", countryName: "Schweden", calendarDays: 4 },
    { countryCode: "SK", countryName: "Slowakei", calendarDays: 4 },
    { countryCode: "SI", countryName: "Slowenien", calendarDays: 5 },
    { countryCode: "ES", countryName: "Spanien", calendarDays: 7 },
    { countryCode: "CZ", countryName: "Tschechien", calendarDays: 3 },
    { countryCode: "HU", countryName: "Ungarn", calendarDays: 4 },
    { countryCode: "CY", countryName: "Zypern", calendarDays: 8 },
];
