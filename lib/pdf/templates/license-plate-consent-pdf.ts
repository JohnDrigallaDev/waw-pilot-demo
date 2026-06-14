import {
    StandardFonts,
    rgb,
    type PDFFont,
    type PDFPage,
} from "pdf-lib";

import { createPdfLayout } from "@/lib/pdf/core/pdf-layout";
import { formatPdfDate } from "@/lib/pdf/core/pdf-format";
import type { LicensePlateCaseDetail } from "@/lib/license-plates/license-plate-detail-queries";

function requireValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
}

function getPlateTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        short_term: "Kurzzeitkennzeichen",
        export: "Ausfuhrkennzeichen",
        red_plate: "Rotes Kennzeichen",
        transfer: "Überführungskennzeichen",
    };

    return labels[type] ?? type;
}

function getVehicleLine(plateCase: LicensePlateCaseDetail): string {
    if (!plateCase.vehicle) return "—";

    return [
        plateCase.vehicle.internal_number,
        plateCase.vehicle.name,
        plateCase.vehicle.vehicle_type,
        plateCase.vehicle.vin ? `FIN: ${plateCase.vehicle.vin}` : null,
        plateCase.vehicle.license_plate
            ? `Kennzeichen: ${plateCase.vehicle.license_plate}`
            : null,
        `Kennzeichenart: ${getPlateTypeLabel(plateCase.plate_type)}`,
    ]
        .filter(Boolean)
        .join(" · ");
}

function splitLongWord(
    word: string,
    font: PDFFont,
    size: number,
    maxWidth: number,
): string[] {
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
    const normalizedText = requireValue(text).replace(/\s+/g, " ").trim();

    if (normalizedText === "—") return ["—"];

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
            if (currentLine.length > 0) {
                lines.push(currentLine);
            }

            currentLine = part;
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
    y: number,
    options: {
        font: PDFFont;
        size: number;
        maxWidth: number;
        lineHeight: number;
        color?: ReturnType<typeof rgb>;
        maxLines?: number;
    },
): number {
    const lines = wrapText(text, options.font, options.size, options.maxWidth);
    const visibleLines = options.maxLines ? lines.slice(0, options.maxLines) : lines;

    visibleLines.forEach((line, index) => {
        page.drawText(line, {
            x,
            y: y - index * options.lineHeight,
            size: options.size,
            font: options.font,
            color: options.color ?? rgb(0, 0, 0),
        });
    });

    return y - visibleLines.length * options.lineHeight;
}

function drawLine(
    page: PDFPage,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
) {
    page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
    });
}

function drawFormLine(
    page: PDFPage,
    params: {
        label: string;
        value: string;
        x: number;
        y: number;
        lineEndX: number;
        labelFont: PDFFont;
        valueFont: PDFFont;
        labelSize?: number;
        valueSize?: number;
        valueX: number;
        valueMaxLines?: number;
        multiLineGap?: number;
    },
): number {
    const labelSize = params.labelSize ?? 10.5;
    const valueSize = params.valueSize ?? 10;
    const valueMaxWidth = params.lineEndX - params.valueX - 4;
    const multiLineGap = params.multiLineGap ?? 18;

    page.drawText(params.label, {
        x: params.x,
        y: params.y,
        size: labelSize,
        font: params.labelFont,
        color: rgb(0, 0, 0),
    });

    const lines = wrapText(params.value, params.valueFont, valueSize, valueMaxWidth);
    const visibleLines = lines.slice(0, params.valueMaxLines ?? 2);

    visibleLines.forEach((line, index) => {
        const lineY = params.y - index * multiLineGap;

        page.drawText(line, {
            x: params.valueX + 3,
            y: lineY,
            size: valueSize,
            font: params.valueFont,
            color: rgb(0, 0, 0),
        });

        drawLine(page, params.valueX, lineY - 4, params.lineEndX, lineY - 4);
    });

    if (visibleLines.length > 1) {
        return params.y - visibleLines.length * multiLineGap - 12;
    }

    return params.y - 28;
}

export async function generateLicensePlateConsentPdf(
    plateCase: LicensePlateCaseDetail,
): Promise<Uint8Array> {
    if (!plateCase.customer || !plateCase.vehicle) {
        throw new Error(
            "Einverständniserklärung konnte nicht erzeugt werden: Kunde oder Fahrzeug fehlt.",
        );
    }

    const ctx = await createPdfLayout();
    const page = ctx.page;

    const helvetica = await ctx.pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await ctx.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const contentX = 58;
    const contentWidth = ctx.width - contentX * 2;
    const lineEndX = contentX + contentWidth;

    const labelValueX = contentX + 150;

    let y = ctx.height - 78;

    y = drawWrappedText(
        page,
        "Einverständniserklärung zur Nutzung von Kurzzeit- und Ausfuhrkennzeichen / Consent Form for the Use of Temporary and Export License Plates",
        contentX,
        y,
        {
            font: helveticaBold,
            size: 13,
            maxWidth: contentWidth,
            lineHeight: 17,
        },
    );

    y -= 32;

    page.drawText("Kundendaten / Customer Information:", {
        x: contentX,
        y,
        size: 11,
        font: helveticaBold,
        color: rgb(0, 0, 0),
    });

    y -= 32;

    y = drawFormLine(page, {
        label: "Name / Firma:",
        value: requireValue(plateCase.customer.name),
        x: contentX,
        y,
        lineEndX,
        labelFont: helvetica,
        valueFont: helvetica,
        valueX: labelValueX,
    });

    y = drawFormLine(page, {
        label: "Adresse / Address:",
        value: requireValue(plateCase.customer.address),
        x: contentX,
        y,
        lineEndX,
        labelFont: helvetica,
        valueFont: helvetica,
        valueX: labelValueX,
    });

    y = drawFormLine(page, {
        label: "Fahrzeug / Vehicle:",
        value: getVehicleLine(plateCase),
        x: contentX,
        y,
        lineEndX,
        labelFont: helvetica,
        valueFont: helvetica,
        valueX: labelValueX,
        valueMaxLines: 3,
        multiLineGap: 24,
    });

    y -= 14;

    const germanParagraphs = [
        "Hiermit bestätigen der oben genannte Kunde bzw. Fahrer und die entsprechende Firma, dass sie von uns über die Nutzung der Kurzzeitkennzeichen bzw. Ausfuhrkennzeichen aufgeklärt wurden.",
        "Sie verpflichten sich ausdrücklich, die Kennzeichen ausschließlich innerhalb des Kreises Herzogtum Lauenburg zu verwenden.",
        "Eine Nutzung außerhalb dieses Gebietes ist nicht gestattet und erfolgt auf eigene Verantwortung.",
    ];

    for (const paragraph of germanParagraphs) {
        y = drawWrappedText(page, paragraph, contentX, y, {
            font: helvetica,
            size: 10,
            maxWidth: contentWidth,
            lineHeight: 14,
        });

        y -= 10;
    }

    y -= 8;

    const englishParagraphs = [
        "The above-named customer and/or driver hereby confirm that they have been informed about the proper use of the temporary and export license plates.",
        "They explicitly agree to use these plates only within the district of Herzogtum Lauenburg.",
        "Use outside this area is not permitted and will be at their own risk.",
    ];

    for (const paragraph of englishParagraphs) {
        y = drawWrappedText(page, paragraph, contentX, y, {
            font: helvetica,
            size: 10,
            maxWidth: contentWidth,
            lineHeight: 14,
        });

        y -= 10;
    }

    y -= 26;

    y = drawFormLine(page, {
        label: "Datum / Date:",
        value: formatPdfDate(plateCase.requested_at ?? new Date().toISOString()),
        x: contentX,
        y,
        lineEndX: contentX + 340,
        labelFont: helvetica,
        valueFont: helvetica,
        valueX: labelValueX,
    });

    y -= 22;

    page.drawText("Unterschrift / Signature:", {
        x: contentX,
        y,
        size: 10.5,
        font: helvetica,
        color: rgb(0, 0, 0),
    });

    drawLine(page, labelValueX, y - 4, lineEndX, y - 4);

    return ctx.pdfDoc.save();
}