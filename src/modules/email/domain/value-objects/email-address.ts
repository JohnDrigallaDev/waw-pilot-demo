import { InvalidEmailAddressError } from "@/src/modules/email/domain/errors/email-errors";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailAddress {
    private constructor(readonly value: string) {}

    static create(value: string): EmailAddress {
        const normalizedValue = value.trim().toLowerCase();

        if (!emailPattern.test(normalizedValue)) {
            throw new InvalidEmailAddressError("Die E-Mail-Adresse ist ungültig.");
        }

        return new EmailAddress(normalizedValue);
    }
}
