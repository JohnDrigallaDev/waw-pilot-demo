type EmailAttachment = {
    filename: string;
    content: Buffer;
    contentType?: string;
};

type SendEmailParams = {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: EmailAttachment[];
};

export class EmailConfigurationError extends Error {
    constructor() {
        super(
            "E-Mail-Versand ist noch nicht eingerichtet. Bitte RESEND_API_KEY und MAIL_FROM konfigurieren.",
        );
        this.name = "EmailConfigurationError";
    }
}

export class EmailSendError extends Error {
    constructor() {
        super("Rechnung konnte nicht per E-Mail gesendet werden. Bitte versuche es erneut.");
        this.name = "EmailSendError";
    }
}

export async function sendEmailWithResend({
    to,
    subject,
    text,
    html,
    attachments = [],
}: SendEmailParams): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
        throw new EmailConfigurationError();
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            text,
            html,
            attachments: attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content.toString("base64"),
                content_type: attachment.contentType,
            })),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("[email] Resend delivery failed", {
            status: response.status,
            response: errorText,
        });
        throw new EmailSendError();
    }
}
