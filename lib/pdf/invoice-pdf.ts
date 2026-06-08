import { readFile } from "fs/promises";
import path from "path";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";
import {
    PDFDocument,
    StandardFonts,
    rgb,
    type PDFFont,
    type PDFPage,
} from "pdf-lib";

export type InvoicePdfData = {
    invoiceType: InvoiceType;
    invoiceNumber: string;
    invoiceDate: string;

    company: {
        legalName: string;
        street: string;
        postalCode: string;
        city: string;
        country: string;
        email: string | null;
        phone: string | null;
        vatId: string | null;
        taxNumber: string | null;
    };

    customer: {
        name: string;
        street: string | null;
        postalCode: string | null;
        city: string | null;
        country: string | null;
        vatId: string | null;
    };

    vehicle: {
        internalNumber: string;
        manufacturer: string;
        model: string;
        vehicleType: string;
        vin: string;
        firstRegistration: string | null;
        constructionYear: number | null;
    };

    amounts: {
        netAmount: number;
        vatRate: number;
        vatAmount: number;
        grossAmount: number;
    };
};

const pageWidth = 595.28;
const pageHeight = 841.89;

const black = rgb(0.08, 0.08, 0.08);
const gray = rgb(0.55, 0.55, 0.55);
const lightGray = rgb(0.86, 0.86, 0.86);
const tableGray = rgb(0.72, 0.72, 0.72);
const red = rgb(0.9, 0.05, 0.05);

function formatDate(value: string | null): string {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("de-DE").format(date);
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

function drawText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    options: {
        font: PDFFont;
        size?: number;
        color?: ReturnType<typeof rgb>;
        maxWidth?: number;
    },
) {
    page.drawText(text, {
        x,
        y,
        size: options.size ?? 10,
        font: options.font,
        color: options.color ?? black,
        maxWidth: options.maxWidth,
    });
}

function drawBox(
    page: PDFPage,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
        borderColor?: ReturnType<typeof rgb>;
        borderWidth?: number;
        fillColor?: ReturnType<typeof rgb>;
    },
) {
    page.drawRectangle({
        x,
        y,
        width,
        height,
        borderColor: options?.borderColor ?? black,
        borderWidth: options?.borderWidth ?? 1,
        color: options?.fillColor,
    });
}

function drawCenteredText(
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    width: number,
    font: PDFFont,
    size: number,
) {
    const textWidth = font.widthOfTextAtSize(text, size);

    page.drawText(text, {
        x: x + (width - textWidth) / 2,
        y,
        size,
        font,
        color: black,
    });
}

function safeText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "-";

    const text = String(value).trim();

    return text.length > 0 ? text : "-";
}

function drawWrappedLines(
    page: PDFPage,
    lines: string[],
    x: number,
    startY: number,
    options: {
        font: PDFFont;
        size: number;
        lineHeight: number;
        color?: ReturnType<typeof rgb>;
    },
) {
    lines.forEach((line, index) => {
        drawText(page, line, x, startY - index * options.lineHeight, {
            font: options.font,
            size: options.size,
            color: options.color,
        });
    });
}

function drawRightAlignedText(
    page: PDFPage,
    text: string,
    rightX: number,
    y: number,
    font: PDFFont,
    size: number,
) {
    const textWidth = font.widthOfTextAtSize(text, size);

    page.drawText(text, {
        x: rightX - textWidth,
        y,
        size,
        font,
        color: black,
    });
}

function getInvoiceTitle(invoiceType: InvoiceType, invoiceNumber: string): string {
    if (invoiceType === "proforma") {
        return "Proforma Anzahlungs Rechnung";
    }

    if (invoiceType === "down_payment") {
        return "Anzahlungs Rechnung";
    }

    return `Rechnung | Invoice ${invoiceNumber}`;
}

function getInvoiceBoxTitle(invoiceType: InvoiceType, invoiceNumber: string): string {
    if (invoiceType === "proforma") {
        return "Anzahlungs-Rechnung: Proforma";
    }

    if (invoiceType === "down_payment") {
        return `Anzahlungs-Rechnung: ${invoiceNumber}`;
    }

    return `Rechnung | Invoice: ${invoiceNumber}`;
}

function getPaymentReasonLabel(invoiceType: InvoiceType): string {
    if (invoiceType === "proforma") {
        return "Artikel - Nummer / item number";
    }

    if (invoiceType === "down_payment") {
        return "Anzahlungs-Rechnung Nr. | Down payment invoice number";
    }

    return "Rechnung Nr. | Invoice Number";
}

function getPrimaryFileLabel(invoiceType: InvoiceType): string {
    if (invoiceType === "proforma") {
        return "Proforma";
    }

    if (invoiceType === "down_payment") {
        return "Anzahlung";
    }

    return "Rechnung";
}

export async function generateInvoicePdf(
    data: InvoicePdfData,
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const logoPath = path.join(process.cwd(), "public", "brand", "waw-logo.png");
    const logoBytes = await readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    page.drawImage(logoImage, {
        x: 38,
        y: 686,
        width: 150,
        height: 118,
    });

    drawText(page, getInvoiceTitle(data.invoiceType, data.invoiceNumber), 226, 795, {
        font: helveticaBold,
        size: data.invoiceType === "standard" ? 24 : 22,
        color: data.invoiceType === "standard" ? gray : black,
    });

    /**
     * Rechte Firmen- und Bankdatenbox
     */
    const infoBoxX = 362;
    const infoBoxY = 506;
    const infoBoxWidth = 178;
    const infoBoxHeight = 240;

    drawBox(page, infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, {
        borderColor: black,
        borderWidth: 1,
    });

    drawBox(page, infoBoxX, 728, infoBoxWidth, 18, {
        borderColor: black,
        borderWidth: 1,
        fillColor: tableGray,
    });

    drawWrappedLines(
        page,
        [
            data.company.legalName,
            data.company.street,
            `${data.company.postalCode} ${data.company.city}`,
            "",
            `Tel: ${safeText(data.company.phone)}`,
            "Mobil 1: +49 (0)160-5265022",
            "Mobil 2: +49 (0)172-4538149",
            `E-Mail: ${safeText(data.company.email)}`,
            `Steuer-Nr: ${safeText(data.company.taxNumber)}`,
            safeText(data.company.vatId),
        ],
        infoBoxX + 6,
        712,
        {
            font: helveticaBold,
            size: 6.4,
            lineHeight: 13,
        },
    );

    const bankBoxY = 488;
    const bankBoxHeight = 112;

    drawBox(page, infoBoxX, bankBoxY, infoBoxWidth, bankBoxHeight, {
        borderColor: red,
        borderWidth: 1.5,
    });

    drawWrappedLines(
        page,
        [
            "Bankverbindung | bank information:",
            "Kreditinstitut/Bank: Hamburger Sparkasse",
            "BLZ: 20050550",
            "IBAN: DE91 2005 0550 1324 1235 69",
            "BIC: HASPDEHHXXX",
            "",
            "Verwendungszweck | reason for payment:",
            getPaymentReasonLabel(data.invoiceType),
            "Fahrgestell-Nr. | Vehicle Identification Number (VIN)",
        ],
        infoBoxX + 6,
        588,
        {
            font: helveticaBold,
            size: 5.8,
            lineHeight: 11,
        },
    );

    /**
     * Linke Rechnungsbox
     */
    drawBox(page, 42, 494, 230, 44, {
        borderColor: black,
        borderWidth: 1,
    });

    drawText(page, getInvoiceBoxTitle(data.invoiceType, data.invoiceNumber), 48, 518, {
        font: helveticaBold,
        size: 10,
    });

    drawText(page, `Rechnungs-Datum: ${formatDate(data.invoiceDate)}`, 48, 502, {
        font: helveticaBold,
        size: 8,
    });

    drawBox(page, 42, 440, 230, 44, {
        borderColor: black,
        borderWidth: 1,
    });

    drawText(page, "Gebrauchte | Pre-owned:", 48, 460, {
        font: helveticaBold,
        size: 9,
    });

    if (data.invoiceType !== "standard") {
        drawText(page, getPrimaryFileLabel(data.invoiceType), 150, 460, {
            font: helveticaBold,
            size: 9,
        });
    }

    /**
     * Fahrzeugtabelle
     */
    const tableX = 42;
    const tableY = 318;
    const tableWidth = 500;
    const tableHeight = 160;

    const col1 = 175;
    const col2 = 250;
    const col3 = tableWidth - col1 - col2;

    drawBox(page, tableX, tableY, tableWidth, tableHeight, {
        borderColor: black,
        borderWidth: 1,
    });

    drawBox(page, tableX, tableY + tableHeight - 24, tableWidth, 24, {
        borderColor: black,
        borderWidth: 1,
        fillColor: tableGray,
    });

    drawBox(page, tableX + col1 + col2, tableY, col3, tableHeight - 24, {
        borderColor: black,
        borderWidth: 0,
        fillColor: lightGray,
    });

    page.drawLine({
        start: { x: tableX + col1, y: tableY },
        end: { x: tableX + col1, y: tableY + tableHeight },
        thickness: 1,
        color: black,
    });

    page.drawLine({
        start: { x: tableX + col1 + col2, y: tableY },
        end: { x: tableX + col1 + col2, y: tableY + tableHeight },
        thickness: 1,
        color: black,
    });

    drawCenteredText(
        page,
        "Fahrzeug | Vehicle",
        tableX,
        tableY + tableHeight - 16,
        col1,
        helveticaBold,
        7,
    );

    drawCenteredText(
        page,
        "Fahrgestellnummer | Chassi number .:",
        tableX + col1,
        tableY + tableHeight - 16,
        col2,
        helveticaBold,
        7,
    );

    drawCenteredText(
        page,
        "Ges.-Preis",
        tableX + col1 + col2,
        tableY + tableHeight - 16,
        col3,
        helveticaBold,
        6.5,
    );

    drawWrappedLines(
        page,
        [
            `Marke: ${safeText(data.vehicle.manufacturer)}`,
            `Art/Typ: ${safeText(data.vehicle.model)}`,
            `Erstzulassung/Baujahr: ${formatDate(
                data.vehicle.firstRegistration,
            )} / ${safeText(data.vehicle.constructionYear)}`,
        ],
        tableX + 18,
        tableY + 112,
        {
            font: helveticaBold,
            size: 8,
            lineHeight: 26,
        },
    );

    drawText(page, safeText(data.vehicle.vin), tableX + col1 + 18, tableY + 112, {
        font: helveticaBold,
        size: 8,
    });

    drawText(
        page,
        "Der Verkauf erfolgt ohne jeglicher Gewährleistung und Garantie!",
        tableX + col1 + 30,
        tableY + 78,
        {
            font: helveticaBold,
            size: 7.5,
        },
    );

    drawRightAlignedText(
        page,
        formatCurrency(data.amounts.netAmount),
        tableX + col1 + col2 + col3 - 6,
        tableY + 112,
        helveticaBold,
        6.5,
    );

    /**
     * Summenbereich
     */
    const totalsX = 430;
    const totalsY = 266;
    const totalsBoxWidth = 95;
    const totalsLabelX = 300;

    drawText(page, "Rechnungswert ohne MwSt.(EUR)", totalsLabelX, totalsY + 28, {
        font: helvetica,
        size: 6.5,
    });

    drawBox(page, totalsX, totalsY + 22, totalsBoxWidth, 18, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawText(page, formatCurrency(data.amounts.netAmount), totalsX + 5, totalsY + 27, {
        font: helveticaBold,
        size: 6.5,
    });

    drawText(page, `davon ${data.amounts.vatRate}% MwST.`, totalsLabelX + 28, totalsY + 10, {
        font: helvetica,
        size: 6.5,
    });

    drawBox(page, totalsX, totalsY + 4, totalsBoxWidth, 18, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawText(page, formatCurrency(data.amounts.vatAmount), totalsX + 5, totalsY + 9, {
        font: helveticaBold,
        size: 6.5,
    });

    drawText(page, "Butto - Gesamtpreis", totalsLabelX + 44, totalsY - 8, {
        font: helveticaBold,
        size: 6.5,
    });

    drawBox(page, totalsX, totalsY - 14, totalsBoxWidth, 18, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawText(page, formatCurrency(data.amounts.grossAmount), totalsX + 5, totalsY - 9, {
        font: helveticaBold,
        size: 6.5,
    });

    /**
     * Zahlungsbedingungen
     */
    drawText(page, "Zahlungsbedingungen | Payment:", 42, 292, {
        font: helveticaBold,
        size: 8,
    });

    drawWrappedLines(
        page,
        [
            "Betrag wird auf das Konto überwiesen. | Payment via bank transfer in advance.",
            "",
            "Delivery terms: EXW (Ex Works) according to Incoterms",
            "Das KFZ wird unter Ausschluss jeder Gewährleistung, so wie es steht, verkauft. | Sold without warranty or guarantee .",
            "",
            "Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1a UStG. | Export delivery exempt from VAT according to § 4 No. 1a German VAT Act.",
        ],
        42,
        274,
        {
            font: helvetica,
            size: 6.5,
            lineHeight: 12,
        },
    );

    /**
     * Footer
     */
    drawText(page, "WAW NUTZFAHRZEUGE", 190, 42, {
        font: helveticaBold,
        size: 20,
        color: gray,
    });

    drawText(page, "Automatisch erzeugt mit KFZ Pilot", 42, 22, {
        font: helveticaOblique,
        size: 6,
        color: gray,
    });

    return pdfDoc.save();
}