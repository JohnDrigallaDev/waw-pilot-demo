import { EmailAddress } from "@/src/modules/email/domain/value-objects/email-address";

export type EmailRecipientKind = "to" | "cc" | "bcc";

export type EmailRecipientProps = {
    email: string;
    name?: string | null;
    kind: EmailRecipientKind;
};

export class EmailRecipient {
    readonly email: EmailAddress;
    readonly name: string | null;
    readonly kind: EmailRecipientKind;

    constructor(props: EmailRecipientProps) {
        this.email = EmailAddress.create(props.email);
        this.name = props.name?.trim() || null;
        this.kind = props.kind;
    }

    toSnapshot() {
        return {
            email: this.email.value,
            name: this.name,
        };
    }
}
