import { readFile } from "node:fs/promises";
import path from "node:path";

import {
    createPdfLayout,
    drawCustomerBlock,
    drawHorizontalLine,
    drawPdfFooter,
    drawPdfHeader,
    drawSignatureLine,
    drawText,
    hexToRgb,
} from "@/lib/pdf/core/pdf-layout";
import { pdfTheme } from "@/lib/pdf/core/pdf-theme";
import { formatPdfDate } from "@/lib/pdf/core/pdf-format";
import type { SaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";

function requireValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
}

function getArrivalMonthLabel(month: string | null | undefined): string {
    const labels: Record<string, string> = {
        "01": "Januar",
        "02": "Februar",
        "03": "März",
        "04": "April",
        "05": "Mai",
        "06": "Juni",
        "07": "Juli",
        "08": "August",
        "09": "September",
        "10": "Oktober",
        "11": "November",
        "12": "Dezember",
    };

    if (!month) return "—";

    return labels[month] ?? month;
}

async function drawLogo(ctx: Awaited<ReturnType<typeof createPdfLayout>>) {
    try {
        const logoPath = path.join(
            process.cwd(),
            "public",
            "brand",
            "waw-logo.png",
        );

        const logoBytes = await readFile(logoPath);
        const logoImage = await ctx.pdfDoc.embedPng(logoBytes);

        const logoWidth = 95;
        const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

        ctx.page.drawImage(logoImage, {
            x: ctx.width - ctx.margin - logoWidth,
            y: ctx.height - ctx.margin - logoHeight + 4,
            width: logoWidth,
            height: logoHeight,
        });
    } catch {
        drawText(ctx, "WAW", ctx.width - ctx.margin - 70, ctx.height - ctx.margin, {
            size: 18,
            bold: true,
            color: pdfTheme.colors.primaryDark,
        });
    }
}

function drawChoiceBox(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    x: number,
    y: number,
    label: string,
) {
    ctx.page.drawRectangle({
        x,
        y: y - 2,
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: hexToRgb(pdfTheme.colors.border),
    });

    drawText(ctx, label, x + 17, y, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.text,
        maxWidth: 230,
    });
}

export async function generateEntryCertificatePdf(
    data: SaleGeneratedDocumentData,
): Promise<Uint8Array> {
    if (!data.company || !data.customer || !data.vehicle || !data.sale || !data.export) {
        throw new Error(
            "Gelangensbestätigung konnte nicht erzeugt werden: Verkaufsdaten sind unvollständig.",
        );
    }

    const ctx = await createPdfLayout();

    await drawLogo(ctx);

    let y = drawPdfHeader(ctx, {
        title: "Gelangensbestätigung",
        subtitle:
            "Bestätigung über das Gelangen des Gegenstands einer innergemeinschaftlichen Lieferung in einen anderen EU-Mitgliedstaat",
        documentNumber: data.sale.invoiceNumber
            ? `Rechnung ${data.sale.invoiceNumber}`
            : null,
    });

    drawText(
        ctx,
        "Angaben zum Abnehmer",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.large,
            bold: true,
            color: pdfTheme.colors.primaryDark,
        },
    );

    y -= 20;

    y = drawCustomerBlock(ctx, data.customer, ctx.margin, y);

    if (data.customer.vatId) {
        drawText(ctx, `USt-ID: ${data.customer.vatId}`, ctx.margin, y - 2, {
            size: pdfTheme.fontSize.small,
            bold: true,
            color: pdfTheme.colors.text,
        });

        y -= 16;
    }

    y -= 16;
    drawHorizontalLine(ctx, y + 8);

    drawText(ctx, "Bestätigung", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    drawText(
        ctx,
        "Hiermit bestätige ich als Abnehmer, dass folgender Gegenstand einer innergemeinschaftlichen Lieferung in den unten genannten EU-Mitgliedstaat gelangt ist:",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 13,
        },
    );

    y -= 46;

    const vehicleDescription = [
        data.vehicle.manufacturer,
        data.vehicle.model,
        data.vehicle.vehicleType,
    ]
        .filter(Boolean)
        .join(" ");

    const rows = [
        {
            label: "Gegenstand",
            value: `1 Fahrzeug, ${vehicleDescription}`,
        },
        {
            label: "Fahrzeug-Identifikationsnummer",
            value: data.vehicle.vin,
        },
        {
            label: "Interne Fahrzeugnummer",
            value: data.vehicle.internalNumber,
        },
        {
            label: "Rechnung",
            value: data.sale.invoiceNumber
                ? `${data.sale.invoiceNumber} vom ${formatPdfDate(data.sale.invoiceDate)}`
                : "—",
        },
        {
            label: "Monat/Jahr des Gelangens",
            value: `${getArrivalMonthLabel(data.export.arrivalMonth)} ${requireValue(
                data.export.arrivalYear,
            )}`,
        },
        {
            label: "Mitgliedstaat und Ort",
            value: `${requireValue(data.export.destinationCountry)}, ${requireValue(
                data.export.destinationCity,
            )}`,
        },
    ];

    rows.forEach((row) => {
        drawText(ctx, row.label, ctx.margin, y, {
            size: pdfTheme.fontSize.small,
            bold: true,
            color: pdfTheme.colors.mutedText,
            maxWidth: 145,
        });

        drawText(ctx, row.value, ctx.margin + 165, y, {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.text,
            maxWidth: ctx.width - ctx.margin * 2 - 165,
            lineHeight: 11,
        });

        y -= 22;
    });

    y -= 8;

    drawText(ctx, "Art der Bestätigung", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    drawChoiceBox(
        ctx,
        ctx.margin,
        y,
        "Der Gegenstand wurde durch den liefernden Unternehmer befördert oder versendet.",
    );

    y -= 20;

    drawChoiceBox(
        ctx,
        ctx.margin,
        y,
        "Der Gegenstand wurde durch den Abnehmer versendet.",
    );

    y -= 20;

    drawChoiceBox(
        ctx,
        ctx.margin,
        y,
        "Der Gegenstand wurde durch den Abnehmer selbst befördert.",
    );

    y -= 34;

    drawText(
        ctx,
        "Diese Bestätigung ist vom Abnehmer oder dessen Vertretungsberechtigten zu unterschreiben. Der Name des Unterzeichnenden ist in Druckschrift anzugeben.",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.mutedText,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 12,
        },
    );

    y -= 52;

    drawText(ctx, `Ausstellungsdatum: ${formatPdfDate(new Date().toISOString())}`, ctx.margin, y, {
        size: pdfTheme.fontSize.normal,
        bold: true,
    });

    y -= 62;

    drawSignatureLine(
        ctx,
        ctx.margin,
        y,
        "Unterschrift des Abnehmers / Vertretungsberechtigten",
        230,
    );

    drawSignatureLine(
        ctx,
        ctx.width - ctx.margin - 230,
        y,
        "Name des Unterzeichnenden in Druckschrift",
        230,
    );

    drawPdfFooter(ctx);

    return ctx.pdfDoc.save();
}