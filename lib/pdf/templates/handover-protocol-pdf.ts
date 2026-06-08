import { readFile } from "node:fs/promises";
import path from "node:path";

import { rgb } from "pdf-lib";

import {
    createPdfLayout,
    drawCompanyBlock,
    drawCustomerBlock,
    drawHorizontalLine,
    drawPdfFooter,
    drawPdfHeader,
    drawSignatureLine,
    drawText,
    drawVehicleSummary,
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

export async function generateHandoverProtocolPdf(
    data: SaleGeneratedDocumentData,
): Promise<Uint8Array> {
    if (!data.company || !data.customer || !data.vehicle || !data.sale) {
        throw new Error(
            "Übergabeprotokoll konnte nicht erzeugt werden: Verkaufsdaten sind unvollständig.",
        );
    }

    const ctx = await createPdfLayout();

    await drawLogo(ctx);

    let y = drawPdfHeader(ctx, {
        title: "Übergabeprotokoll",
        subtitle: `zur Rechnungsnummer: ${requireValue(data.sale.invoiceNumber)}`,
        documentNumber: data.sale.invoiceNumber
            ? `Rechnung ${data.sale.invoiceNumber}`
            : null,
    });

    drawText(
        ctx,
        "Sehr geehrte Kundin, sehr geehrter Kunde,",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            bold: true,
        },
    );

    y -= 18;

    drawText(
        ctx,
        "wir bedanken uns für Ihr Vertrauen, dass Sie uns mit dem Kauf eines Fahrzeugs entgegengebracht haben. Folgende Dokumente und Zubehör wurden Ihnen verbunden mit dem Fahrzeug ausgehändigt.",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 13,
        },
    );

    y -= 54;

    const leftX = ctx.margin;
    const rightX = ctx.margin + 275;

    drawText(ctx, "Käufer / Firma", leftX, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    drawText(ctx, "Verkäufer", rightX, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 20;

    const customerEndY = drawCustomerBlock(ctx, data.customer, leftX, y);
    const companyEndY = drawCompanyBlock(ctx, data.company, rightX, y);

    y = Math.min(customerEndY, companyEndY) - 24;

    drawHorizontalLine(ctx, y + 10);

    drawText(ctx, "Fahrzeugdaten", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 22;

    y = drawVehicleSummary(ctx, data.vehicle, ctx.margin, y);

    y -= 10;

    drawText(ctx, "Baujahr / Erstzulassung", ctx.margin, y, {
        size: pdfTheme.fontSize.small,
        bold: true,
        color: pdfTheme.colors.mutedText,
    });

    drawText(
        ctx,
        [
            data.vehicle.constructionYear
                ? `Baujahr ${data.vehicle.constructionYear}`
                : null,
            data.vehicle.firstRegistration
                ? `Erstzulassung ${formatPdfDate(data.vehicle.firstRegistration)}`
                : null,
        ]
            .filter(Boolean)
            .join(" / ") || "—",
        ctx.margin + 120,
        y,
        {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.text,
            maxWidth: 260,
        },
    );

    y -= 34;

    drawText(ctx, "Übergebene Unterlagen und Zubehör", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    const checklist = [
        "Fahrzeugschein und Fahrzeugbrief",
        "Fahrzeugschlüssel",
        "Fahrzeug",
    ];

    checklist.forEach((item) => {
        ctx.page.drawRectangle({
            x: ctx.margin,
            y: y - 2,
            width: 10,
            height: 10,
            borderWidth: 1,
            borderColor: hexToRgb(pdfTheme.colors.border),
            color: rgb(1, 1, 1),
        });

        drawText(ctx, item, ctx.margin + 18, y, {
            size: pdfTheme.fontSize.normal,
            color: pdfTheme.colors.text,
        });

        y -= 18;
    });

    y -= 18;

    drawText(
        ctx,
        "Die oben genannten Dokumente und Gegenstände wurden dem Käufer bzw. dessen Beauftragten übergeben.",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 13,
        },
    );

    y -= 56;

    const dateText = `Datum: ${formatPdfDate(data.sale.saleDate)}`;
    drawText(ctx, dateText, ctx.margin, y, {
        size: pdfTheme.fontSize.normal,
        bold: true,
    });

    y -= 62;

    drawSignatureLine(ctx, ctx.margin, y, "Unterschrift / Stempel Käufer", 210);
    drawSignatureLine(
        ctx,
        ctx.width - ctx.margin - 210,
        y,
        "Unterschrift / Stempel WAW Nutzfahrzeuge",
        210,
    );

    drawPdfFooter(ctx);

    return ctx.pdfDoc.save();
}