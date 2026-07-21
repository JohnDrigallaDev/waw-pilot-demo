export const emailSendStatuses = [
    "DRAFT",
    "READY_TO_SEND",
    "SENDING",
    "SENT",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
    "BOUNCED",
    "COMPLAINED",
    "REJECTED",
    "LEGACY_SENT",
] as const;

export type EmailSendStatus = (typeof emailSendStatuses)[number];

export const emailStatusLabels: Record<EmailSendStatus, string> = {
    DRAFT: "Entwurf",
    READY_TO_SEND: "Versandbereit",
    SENDING: "Wird gesendet",
    SENT: "Gesendet",
    DELIVERED: "Zugestellt",
    FAILED: "Fehlgeschlagen",
    CANCELLED: "Abgebrochen",
    BOUNCED: "Nicht zustellbar",
    COMPLAINED: "Beanstandet",
    REJECTED: "Abgelehnt",
    LEGACY_SENT: "Historisch gesendet",
};

export function canTransitionEmailStatus(
    currentStatus: EmailSendStatus,
    nextStatus: EmailSendStatus,
): boolean {
    const transitions: Record<EmailSendStatus, EmailSendStatus[]> = {
        DRAFT: ["READY_TO_SEND", "CANCELLED"],
        READY_TO_SEND: ["SENDING", "CANCELLED"],
        SENDING: ["SENT", "FAILED"],
        SENT: ["DELIVERED", "BOUNCED", "COMPLAINED"],
        DELIVERED: [],
        FAILED: ["READY_TO_SEND", "CANCELLED"],
        CANCELLED: [],
        BOUNCED: [],
        COMPLAINED: [],
        REJECTED: [],
        LEGACY_SENT: [],
    };

    return transitions[currentStatus].includes(nextStatus);
}
