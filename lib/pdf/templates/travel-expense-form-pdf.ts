import { readFile } from "node:fs/promises";
import path from "node:path";

import {
    createPdfLayout,
    drawHorizontalLine,
    drawPdfFooter,
    drawPdfHeader,
    drawSignatureLine,
    drawText,
    hexToRgb,
} from "@/lib/pdf/core/pdf-layout";
import { pdfTheme } from "@/lib/pdf/core/pdf-theme";
import { formatPdfDate } from "@/lib/pdf/core/pdf-format";

export type TravelExpensePdfData = {
    driverName: string;
    travelDate: string;
    visitedCustomer: string;
    location: string;
    vehicleOrPlate: string;
    purpose: string;
    startMileage: number | null;
    endMileage: number | null;
    notes: string | null;
};

function requireValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
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

        const logoWidth = 105;
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

function drawFieldLine(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    label: string,
    value: string,
    x: number,
    y: number,
    width = 470,
): number {
    drawText(ctx, label, x, y, {
        size: pdfTheme.fontSize.small,
        bold: true,
        color: pdfTheme.colors.mutedText,
        maxWidth: 145,
    });

    drawText(ctx, value, x + 155, y, {
        size: pdfTheme.fontSize.normal,
        bold: true,
        color: pdfTheme.colors.text,
        maxWidth: width - 155,
        lineHeight: 12,
    });

    drawHorizontalLine(ctx, y - 7, {
        x: x + 155,
        width: width - 155,
        color: pdfTheme.colors.border,
    });

    return y - 32;
}

function drawCheckbox(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    x: number,
    y: number,
    label: string,
): number {
    ctx.page.drawRectangle({
        x,
        y: y - 2,
        width: 11,
        height: 11,
        borderWidth: 1,
        borderColor: hexToRgb(pdfTheme.colors.border),
    });

    drawText(ctx, label, x + 18, y, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.text,
    });

    return y - 22;
}

export async function generateTravelExpenseFormPdf(
    data: TravelExpensePdfData,
): Promise<Uint8Array> {
    const ctx = await createPdfLayout();

    await drawLogo(ctx);

    let y = drawPdfHeader(ctx, {
        title: "WAW Reisekostenformular",
        subtitle: "Interne Dokumentation von Kundenfahrten, Händlerfahrten und Servicefahrten",
    });

    drawText(ctx, "Angaben zur Fahrt", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 28;

    y = drawFieldLine(ctx, "Mitarbeiter / Fahrer", data.driverName, ctx.margin, y);
    y = drawFieldLine(ctx, "Datum", formatPdfDate(data.travelDate), ctx.margin, y);
    y = drawFieldLine(ctx, "Besuchter Kunde / Firma", data.visitedCustomer, ctx.margin, y);
    y = drawFieldLine(ctx, "Ort", data.location, ctx.margin, y);
    y = drawFieldLine(ctx, "Fahrzeug / Kennzeichen", data.vehicleOrPlate, ctx.margin, y);
    y = drawFieldLine(ctx, "Zweck der Fahrt", data.purpose, ctx.margin, y);

    y -= 8;

    drawHorizontalLine(ctx, y + 12);

    drawText(ctx, "Kilometerangaben", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 30;

    const startMileage = data.startMileage === null ? "—" : `${data.startMileage} km`;
    const endMileage = data.endMileage === null ? "—" : `${data.endMileage} km`;
    const distance =
        data.startMileage !== null && data.endMileage !== null
            ? `${Math.max(data.endMileage - data.startMileage, 0)} km`
            : "—";

    y = drawFieldLine(ctx, "Startkilometer", startMileage, ctx.margin, y);
    y = drawFieldLine(ctx, "Endkilometer", endMileage, ctx.margin, y);
    y = drawFieldLine(ctx, "Gefahrene Kilometer", distance, ctx.margin, y);

    y -= 8;

    drawHorizontalLine(ctx, y + 12);

    drawText(ctx, "Belege", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 30;

    y = drawCheckbox(ctx, ctx.margin, y, "Tankbeleg beigefügt");
    y = drawCheckbox(ctx, ctx.margin, y, "Parkbeleg beigefügt");
    y = drawCheckbox(ctx, ctx.margin, y, "Mautbeleg beigefügt");
    y = drawCheckbox(ctx, ctx.margin, y, "Sonstige Belege beigefügt");

    y -= 8;

    drawHorizontalLine(ctx, y + 12);

    drawText(ctx, "Bemerkungen", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 26;

    const notes = requireValue(data.notes);

    ctx.page.drawRectangle({
        x: ctx.margin,
        y: y - 72,
        width: ctx.width - ctx.margin * 2,
        height: 82,
        borderWidth: 1,
        borderColor: hexToRgb(pdfTheme.colors.lightBorder),
        color: hexToRgb(pdfTheme.colors.background),
    });

    drawText(ctx, notes, ctx.margin + 12, y - 10, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.text,
        maxWidth: ctx.width - ctx.margin * 2 - 24,
        lineHeight: 12,
    });

    y -= 120;

    drawSignatureLine(ctx, ctx.margin, y, "Unterschrift Mitarbeiter / Fahrer", 230);

    drawSignatureLine(
        ctx,
        ctx.width - ctx.margin - 210,
        y,
        "Prüfung / Freigabe",
        210,
    );

    drawPdfFooter(ctx);

    return ctx.pdfDoc.save();
}