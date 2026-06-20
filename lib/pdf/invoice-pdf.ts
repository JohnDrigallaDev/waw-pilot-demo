import { readFile } from "fs/promises";
import path from "path";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";
import type { SaleType } from "@/lib/sales/sale-queries";
import {
    PDFDocument,
    StandardFonts,
    rgb,
    type PDFFont,
    type PDFPage,
} from "pdf-lib";

export type InvoicePdfData = {
    invoiceType: InvoiceType;
    saleType: SaleType;
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

function safeText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "-";

    const text = String(value).trim();

    return text.length > 0 ? text : "-";
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

function drawLine(
    page: PDFPage,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    thickness = 1,
    color = black,
) {
    page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness,
        color,
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

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const parts: string[] = [];
    let current = "";

    for (const character of word) {
        const next = `${current}${character}`;

        if (font.widthOfTextAtSize(next, size) <= maxWidth || current.length === 0) {
            current = next;
            continue;
        }

        parts.push(current);
        current = character;
    }

    if (current.length > 0) {
        parts.push(current);
    }

    return parts;
}

function wrapText(
    text: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
): string[] {
    const normalizedText = safeText(text).replace(/\s+/g, " ").trim();

    if (normalizedText === "-") return ["-"];

    const words = normalizedText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;

        if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
            currentLine = testLine;
            continue;
        }

        if (currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = "";
        }

        if (font.widthOfTextAtSize(word, size) <= maxWidth) {
            currentLine = word;
            continue;
        }

        const splitParts = splitLongWord(word, font, size, maxWidth);

        for (const part of splitParts) {
            if (font.widthOfTextAtSize(part, size) <= maxWidth) {
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }

                currentLine = part;
            }
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}

function drawWrappedText(
    page: PDFPage,
    text: string,
    x: number,
    startY: number,
    options: {
        font: PDFFont;
        size: number;
        lineHeight: number;
        maxWidth: number;
        maxLines?: number;
        color?: ReturnType<typeof rgb>;
    },
): number {
    const lines = wrapText(text, options.font, options.size, options.maxWidth);
    const visibleLines = options.maxLines ? lines.slice(0, options.maxLines) : lines;

    visibleLines.forEach((line, index) => {
        drawText(page, line, x, startY - index * options.lineHeight, {
            font: options.font,
            size: options.size,
            color: options.color,
            maxWidth: options.maxWidth,
        });
    });

    return startY - visibleLines.length * options.lineHeight;
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
        maxWidth?: number;
        color?: ReturnType<typeof rgb>;
    },
) {
    let y = startY;

    for (const line of lines) {
        if (line.trim().length === 0) {
            y -= options.lineHeight;
            continue;
        }

        if (options.maxWidth) {
            y = drawWrappedText(page, line, x, y, {
                font: options.font,
                size: options.size,
                lineHeight: options.lineHeight,
                maxWidth: options.maxWidth,
                color: options.color,
            });
        } else {
            drawText(page, line, x, y, {
                font: options.font,
                size: options.size,
                color: options.color,
            });

            y -= options.lineHeight;
        }
    }
}

function drawCellText(
    page: PDFPage,
    text: string,
    x: number,
    topY: number,
    width: number,
    options: {
        font: PDFFont;
        size: number;
        lineHeight: number;
        paddingX?: number;
        paddingTop?: number;
        maxLines?: number;
        align?: "left" | "center" | "right";
        color?: ReturnType<typeof rgb>;
    },
) {
    const paddingX = options.paddingX ?? 6;
    const paddingTop = options.paddingTop ?? 8;
    const maxWidth = width - paddingX * 2;
    const lines = wrapText(text, options.font, options.size, maxWidth);
    const visibleLines = options.maxLines ? lines.slice(0, options.maxLines) : lines;

    visibleLines.forEach((line, index) => {
        const textWidth = options.font.widthOfTextAtSize(line, options.size);

        let textX = x + paddingX;

        if (options.align === "center") {
            textX = x + (width - textWidth) / 2;
        }

        if (options.align === "right") {
            textX = x + width - paddingX - textWidth;
        }

        page.drawText(line, {
            x: textX,
            y: topY - paddingTop - index * options.lineHeight,
            size: options.size,
            font: options.font,
            color: options.color ?? black,
        });
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

    return "";
}

function getThirdVehicleLineLabel(invoiceType: InvoiceType): string {
    if (invoiceType === "proforma") {
        return "Betriebsstunden:";
    }

    return "Erstzulassung/Baujahr:";
}

function getThirdVehicleLineValue(data: InvoicePdfData): string {
    if (data.invoiceType === "proforma") {
        return "";
    }

    return `${formatDate(data.vehicle.firstRegistration)} / ${safeText(
        data.vehicle.constructionYear,
    )}`;
}

function getCustomerAddressLines(data: InvoicePdfData): string[] {
    return [
        data.customer.name,
        data.customer.street,
        [data.customer.postalCode, data.customer.city]
            .filter(Boolean)
            .join(" "),
        data.customer.country,
        data.customer.vatId ? `USt-ID: ${data.customer.vatId}` : null,
    ].filter((line): line is string => Boolean(line && line.trim().length > 0));
}

function getSaleTypeInvoiceLabel(saleType: SaleType): string {
    if (saleType === "eu") {
        return "EU-Lieferung";
    }

    if (saleType === "export_third_country") {
        return "Drittland Export";
    }

    return "Inland Deutschland";
}

function getPaymentAndTaxLines(data: InvoicePdfData): string[] {
    const baseLines = [
        "Betrag wird auf das Konto überwiesen. | Payment via bank transfer in advance.",
        "",
        "Delivery terms: EXW (Ex Works) according to Incoterms",
        "Das KFZ wird unter Ausschluss jeder Gewährleistung, so wie es steht, verkauft. | Sold without warranty or guarantee .",
    ];

    if (data.saleType === "eu") {
        return [
            ...baseLines,
            "",
            "Steuerfreie innergemeinschaftliche Lieferung gemäß § 4 Nr. 1b UStG i.V.m. § 6a UStG. | Intra-Community supply exempt from VAT.",
        ];
    }

    if (data.saleType === "export_third_country") {
        return [
            ...baseLines,
            "",
            "Steuerfreie Ausfuhrlieferung gemäß § 4 Nr. 1a UStG. | Export delivery exempt from VAT according to § 4 No. 1a German VAT Act.",
        ];
    }

    return baseLines;
}

export async function generateInvoicePdf(
    data: InvoicePdfData,
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logoPath = path.join(process.cwd(), "public", "brand", "waw-logo.png");
    const logoBytes = await readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);

    page.drawImage(logoImage, {
        x: 40,
        y: 708,
        width: 120,
        height: 95,
    });

    drawText(page, getInvoiceTitle(data.invoiceType, data.invoiceNumber), 210, 805, {
        font: helveticaBold,
        size: data.invoiceType === "standard" ? 22 : 21,
        color: data.invoiceType === "standard" ? gray : black,
        maxWidth: 340,
    });

    /**
     * Empfängeradresse / Käufer
     */
    drawText(page, "Käufer | Buyer:", 42, 662, {
        font: helveticaBold,
        size: 7.2,
        color: gray,
    });

    drawWrappedLines(page, getCustomerAddressLines(data), 42, 646, {
        font: helveticaBold,
        size: 7,
        lineHeight: 10,
        maxWidth: 245,
    });

    drawText(page, getSaleTypeInvoiceLabel(data.saleType), 42, 586, {
        font: helveticaBold,
        size: 6.5,
        color: gray,
    });

    /**
     * Rechte Firmen- und Bankdatenbox
     */
    const infoBoxX = 378;
    const infoBoxY = 468;
    const infoBoxWidth = 178;
    const infoBoxHeight = 250;
    const infoHeaderHeight = 18;

    drawBox(page, infoBoxX, infoBoxY, infoBoxWidth, infoBoxHeight, {
        borderColor: black,
        borderWidth: 1,
    });

    drawBox(page, infoBoxX, infoBoxY + infoBoxHeight - infoHeaderHeight, infoBoxWidth, infoHeaderHeight, {
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
        infoBoxY + infoBoxHeight - 35,
        {
            font: helveticaBold,
            size: 5.7,
            lineHeight: 11,
            maxWidth: infoBoxWidth - 12,
        },
    );

    const bankBoxY = infoBoxY;
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
            data.invoiceType === "proforma"
                ? "Fahrgestellnummer / vehicle identification number"
                : "Fahrgestell-Nr. | Vehicle Identification Number (VIN)",
        ],
        infoBoxX + 6,
        bankBoxY + bankBoxHeight - 13,
        {
            font: helveticaBold,
            size: 5.3,
            lineHeight: 10,
            maxWidth: infoBoxWidth - 12,
        },
    );

    /**
     * Linke Rechnungsbox
     */
    drawBox(page, 42, 500, 230, 44, {
        borderColor: black,
        borderWidth: 1,
    });

    drawWrappedText(page, getInvoiceBoxTitle(data.invoiceType, data.invoiceNumber), 48, 525, {
        font: helveticaBold,
        size: 9,
        lineHeight: 10,
        maxWidth: 215,
        maxLines: 1,
    });

    drawText(page, `Rechnungs-Datum: ${formatDate(data.invoiceDate)}`, 48, 507, {
        font: helveticaBold,
        size: 8,
    });

    /**
     * Gebrauchte Box - bewusst mit Abstand zur Fahrzeugtabelle
     */
    drawBox(page, 42, 444, 230, 44, {
        borderColor: black,
        borderWidth: 1,
    });

    drawText(page, "Gebrauchte | Pre-owned:", 48, 463, {
        font: helveticaBold,
        size: 8,
    });

    const primaryFileLabel = getPrimaryFileLabel(data.invoiceType);

    if (primaryFileLabel) {
        drawText(page, primaryFileLabel, 150, 463, {
            font: helveticaBold,
            size: 8,
        });
    }

    /**
     * Fahrzeugtabelle
     */
    const tableX = 42;
    const tableY = 205;
    const tableWidth = 515;
    const tableHeight = 190;

    const headerHeight = 23;
    const col1 = 175;
    const col3 = 75;
    const col2 = tableWidth - col1 - col3;

    const tableTopY = tableY + tableHeight;
    const tableContentTopY = tableTopY - headerHeight;

    drawBox(page, tableX, tableY, tableWidth, tableHeight, {
        borderColor: black,
        borderWidth: 1,
    });

    drawBox(page, tableX, tableTopY - headerHeight, tableWidth, headerHeight, {
        borderColor: black,
        borderWidth: 1,
        fillColor: tableGray,
    });

    drawBox(page, tableX + col1 + col2, tableY, col3, tableHeight, {
        borderColor: black,
        borderWidth: 0,
        fillColor: lightGray,
    });

    drawLine(page, tableX + col1, tableY, tableX + col1, tableTopY);
    drawLine(page, tableX + col1 + col2, tableY, tableX + col1 + col2, tableTopY);
    drawLine(page, tableX, tableContentTopY, tableX + tableWidth, tableContentTopY);

    drawCenteredText(
        page,
        "Fahrzeug | Vehicle",
        tableX,
        tableTopY - 15,
        col1,
        helveticaBold,
        6.5,
    );

    drawCenteredText(
        page,
        "Fahrgestellnummer | Chassi number .:",
        tableX + col1,
        tableTopY - 15,
        col2,
        helveticaBold,
        6.5,
    );

    drawCenteredText(
        page,
        "Ges.-Preis",
        tableX + col1 + col2,
        tableTopY - 15,
        col3,
        helveticaBold,
        6.2,
    );

    const vehicleLabelX = tableX + 16;
    const vehicleValueX = tableX + 72;
    const vehicleStartY = tableContentTopY - 12;
    const vehicleLineHeight = 25;

    drawText(page, "Marke:", vehicleLabelX, vehicleStartY, {
        font: helveticaBold,
        size: 7,
    });

    drawWrappedText(page, safeText(data.vehicle.manufacturer), vehicleValueX, vehicleStartY, {
        font: helveticaBold,
        size: 7,
        lineHeight: 8,
        maxWidth: col1 - 86,
        maxLines: 2,
    });

    drawText(page, "Art/Typ:", vehicleLabelX, vehicleStartY - vehicleLineHeight, {
        font: helveticaBold,
        size: 7,
    });

    drawWrappedText(page, safeText(data.vehicle.model), vehicleValueX, vehicleStartY - vehicleLineHeight, {
        font: helveticaBold,
        size: 7,
        lineHeight: 8,
        maxWidth: col1 - 86,
        maxLines: 2,
    });

    drawText(page, getThirdVehicleLineLabel(data.invoiceType), vehicleLabelX, vehicleStartY - vehicleLineHeight * 2, {
        font: helveticaBold,
        size: 7,
    });

    drawWrappedText(page, getThirdVehicleLineValue(data), vehicleValueX + 26, vehicleStartY - vehicleLineHeight * 2, {
        font: helveticaBold,
        size: 7,
        lineHeight: 8,
        maxWidth: col1 - 112,
        maxLines: 2,
    });

    drawCellText(
        page,
        safeText(data.vehicle.vin),
        tableX + col1,
        tableContentTopY,
        col2,
        {
            font: helveticaBold,
            size: 7,
            lineHeight: 8,
            paddingX: 18,
            paddingTop: 14,
            maxLines: 3,
        },
    );

    drawCellText(
        page,
        "Der Verkauf erfolgt ohne jeglicher Gewährleistung und Garantie!",
        tableX + col1,
        tableContentTopY - 50,
        col2,
        {
            font: helveticaBold,
            size: 7,
            lineHeight: 9,
            paddingX: 28,
            paddingTop: 10,
            maxLines: 3,
            align: "center",
        },
    );

    drawCellText(
        page,
        formatCurrency(data.amounts.netAmount),
        tableX + col1 + col2,
        tableContentTopY,
        col3,
        {
            font: helveticaBold,
            size: 6.2,
            lineHeight: 7,
            paddingX: 6,
            paddingTop: 23,
            maxLines: 2,
            align: "right",
        },
    );

    /**
     * Zahlungsbedingungen und Summenbereich
     */
    const paymentTitleY = 188;

    drawText(page, "Zahlungsbedingungen | Payment:", 42, paymentTitleY, {
        font: helveticaBold,
        size: 7.5,
    });

    drawWrappedLines(
        page,
        getPaymentAndTaxLines(data),
        42,
        174,
        {
            font: helvetica,
            size: 5.5,
            lineHeight: 10,
            maxWidth: 345,
        },
    );

    const totalsX = tableX + col1 + col2;
    const totalsY = 150;
    const totalsBoxWidth = col3;
    const totalsBoxHeight = 18;
    const totalsLabelRightX = totalsX - 8;

    drawRightAlignedText(
        page,
        "Rechnungswert ohne MwSt.(EUR)",
        totalsLabelRightX,
        totalsY + 41,
        helvetica,
        5.8,
    );

    drawBox(page, totalsX, totalsY + 35, totalsBoxWidth, totalsBoxHeight, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawRightAlignedText(
        page,
        formatCurrency(data.amounts.netAmount),
        totalsX + totalsBoxWidth - 6,
        totalsY + 41,
        helveticaBold,
        5.8,
    );

    drawRightAlignedText(
        page,
        `davon ${data.amounts.vatRate}% MwST.`,
        totalsLabelRightX,
        totalsY + 23,
        helvetica,
        5.8,
    );

    drawBox(page, totalsX, totalsY + 17, totalsBoxWidth, totalsBoxHeight, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawRightAlignedText(
        page,
        formatCurrency(data.amounts.vatAmount),
        totalsX + totalsBoxWidth - 6,
        totalsY + 23,
        helveticaBold,
        5.8,
    );

    drawRightAlignedText(
        page,
        "Brutto - Gesamtpreis",
        totalsLabelRightX,
        totalsY + 5,
        helveticaBold,
        5.8,
    );

    drawBox(page, totalsX, totalsY - 1, totalsBoxWidth, totalsBoxHeight, {
        borderColor: black,
        borderWidth: 1,
        fillColor: lightGray,
    });

    drawRightAlignedText(
        page,
        formatCurrency(data.amounts.grossAmount),
        totalsX + totalsBoxWidth - 6,
        totalsY + 5,
        helveticaBold,
        5.8,
    );

    /**
     * Footer - ohne "Automatisch erzeugt mit KFZ Pilot"
     */
    drawText(page, "WAW NUTZFAHRZEUGE", 190, 42, {
        font: helveticaBold,
        size: 20,
        color: gray,
    });

    return pdfDoc.save();
}