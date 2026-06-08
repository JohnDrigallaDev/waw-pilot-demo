export function getInvoiceYearPrefix(date = new Date()): string {
    const year = date.getFullYear();
    return String(year).slice(-2).padStart(2, "0").padStart(3, "0");
}

export function formatInvoiceNumber(yearPrefix: string, sequenceNumber: number): string {
    return `${yearPrefix}-${String(sequenceNumber).padStart(3, "0")}`;
}

export function getNextInvoiceNumberPreview(date: Date, nextSequenceNumber: number): string {
    return formatInvoiceNumber(getInvoiceYearPrefix(date), nextSequenceNumber);
}