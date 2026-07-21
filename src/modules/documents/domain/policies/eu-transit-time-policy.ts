import {
    euTransitTimeDefinitions,
    type EuCountryCode,
    type EuTransitTimeDefinition,
} from "@/src/modules/documents/domain/constants/eu-transit-times";

const countryAliases: Record<string, EuCountryCode> = {
    AT: "AT",
    AUSTRIA: "AT",
    ÖSTERREICH: "AT",
    OESTERREICH: "AT",
    OSTERREICH: "AT",
    BE: "BE",
    BELGIEN: "BE",
    BELGIUM: "BE",
    BG: "BG",
    BULGARIEN: "BG",
    BULGARIA: "BG",
    CY: "CY",
    ZYPERN: "CY",
    CYPRUS: "CY",
    CZ: "CZ",
    TSCHECHIEN: "CZ",
    CZECHIA: "CZ",
    DE: "DE",
    DEUTSCHLAND: "DE",
    GERMANY: "DE",
    DK: "DK",
    DÄNEMARK: "DK",
    DAENEMARK: "DK",
    DANEMARK: "DK",
    DENMARK: "DK",
    EE: "EE",
    ESTLAND: "EE",
    ESTONIA: "EE",
    ES: "ES",
    SPANIEN: "ES",
    SPAIN: "ES",
    FI: "FI",
    FINNLAND: "FI",
    FINLAND: "FI",
    FR: "FR",
    FRANKREICH: "FR",
    FRANCE: "FR",
    GR: "GR",
    GRIECHENLAND: "GR",
    GREECE: "GR",
    HR: "HR",
    KROATIEN: "HR",
    CROATIA: "HR",
    HU: "HU",
    UNGARN: "HU",
    HUNGARY: "HU",
    IE: "IE",
    IRLAND: "IE",
    IRELAND: "IE",
    IT: "IT",
    ITALIEN: "IT",
    ITALY: "IT",
    LT: "LT",
    LITAUEN: "LT",
    LITHUANIA: "LT",
    LU: "LU",
    LUXEMBURG: "LU",
    LUXEMBOURG: "LU",
    LV: "LV",
    LETTLAND: "LV",
    LATVIA: "LV",
    MT: "MT",
    MALTA: "MT",
    NL: "NL",
    NIEDERLANDE: "NL",
    NETHERLANDS: "NL",
    PL: "PL",
    POLEN: "PL",
    POLAND: "PL",
    PT: "PT",
    PORTUGAL: "PT",
    RO: "RO",
    RUMÄNIEN: "RO",
    RUMAENIEN: "RO",
    RUMANIEN: "RO",
    ROMANIA: "RO",
    SE: "SE",
    SCHWEDEN: "SE",
    SWEDEN: "SE",
    SI: "SI",
    SLOWENIEN: "SI",
    SLOVENIA: "SI",
    SK: "SK",
    SLOWAKEI: "SK",
    SLOVAKIA: "SK",
};

export class EuTransitTimePolicy {
    resolveCountryCode(country: string | null | undefined): EuCountryCode | null {
        if (!country) return null;

        const normalized = country
            .trim()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();

        return countryAliases[normalized] ?? null;
    }

    getTransitTime(country: string | null | undefined): EuTransitTimeDefinition | null {
        const countryCode = this.resolveCountryCode(country);

        if (!countryCode) return null;

        return (
            euTransitTimeDefinitions.find(
                (definition) => definition.countryCode === countryCode,
            ) ?? null
        );
    }
}
