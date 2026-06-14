import { readFile } from "node:fs/promises";
import path from "node:path";

import { rgb } from "pdf-lib";

import {
    createPdfLayout,
    drawText,
} from "@/lib/pdf/core/pdf-layout";
import { pdfTheme } from "@/lib/pdf/core/pdf-theme";
import { formatPdfDate } from "@/lib/pdf/core/pdf-format";
import type { SaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";

function requireValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
}

function getCustomerAddress(data: SaleGeneratedDocumentData): string {
    if (!data.customer) return "—";

    return [
        data.customer.street,
        [data.customer.postalCode, data.customer.city].filter(Boolean).join(" "),
        data.customer.country,
    ]
        .filter(Boolean)
        .join(", ");
}

function getVehicleType(data: SaleGeneratedDocumentData): string {
    if (!data.vehicle) return "—";

    return [
        data.vehicle.manufacturer,
        data.vehicle.model,
        data.vehicle.vehicleType ? `(${data.vehicle.vehicleType})` : null,
    ]
        .filter(Boolean)
        .join(" ")
        .trim() || "—";
}

function getVehicleNumber(data: SaleGeneratedDocumentData): string {
    if (!data.vehicle) return "—";

    return [
        data.vehicle.vin,
        data.vehicle.internalNumber,
    ]
        .filter(Boolean)
        .join(" / ") || "—";
}

function getConstructionYearAndFirstRegistration(
    data: SaleGeneratedDocumentData,
): string {
    if (!data.vehicle) return "—";

    return [
        data.vehicle.constructionYear
            ? `Baujahr ${data.vehicle.constructionYear}`
            : null,
        data.vehicle.firstRegistration
            ? `Erstzulassung ${formatPdfDate(data.vehicle.firstRegistration)}`
            : null,
    ]
        .filter(Boolean)
        .join(" / ") || "—";
}

function getInvoiceNumber(data: SaleGeneratedDocumentData): string {
    return requireValue(data.sale?.invoiceNumber);
}

function getDocumentDate(data: SaleGeneratedDocumentData): string {
    return formatPdfDate(data.sale?.saleDate ?? data.sale?.invoiceDate ?? null);
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
            y: ctx.height - ctx.margin - logoHeight + 6,
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

function drawFormRow(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    params: {
        label: string;
        value: string;
        x: number;
        y: number;
        rowHeight?: number;
    },
): number {
    const valueX = params.x + 220;
    const valueWidth = ctx.width - ctx.margin - valueX;
    const rowHeight = params.rowHeight ?? 36;

    drawText(ctx, params.label, params.x, params.y, {
        size: 10,
        bold: true,
        color: pdfTheme.colors.text,
        maxWidth: 205,
        lineHeight: 12,
    });

    drawText(ctx, params.value, valueX, params.y, {
        size: 10,
        color: pdfTheme.colors.text,
        maxWidth: valueWidth,
        lineHeight: 13,
    });

    return params.y - rowHeight;
}

function drawSimpleLine(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
) {
    ctx.page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: 1,
        color: rgb(0.08, 0.08, 0.08),
    });
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

    let y = ctx.height - ctx.margin - 30;

    drawText(
        ctx,
        `Übergabeprotokoll zur Rechnungsnummer: ${getInvoiceNumber(data)}`,
        ctx.margin,
        y,
        {
            size: 18,
            bold: true,
            color: pdfTheme.colors.text,
            maxWidth: 360,
            lineHeight: 22,
        },
    );

    y -= 58;

    drawText(ctx, "Sehr geehrte Kundin, sehr geehrter Kunde", ctx.margin, y, {
        size: 11,
        bold: true,
        color: pdfTheme.colors.text,
    });

    y -= 24;

    drawText(
        ctx,
        "wir bedanken uns für Ihr Vertrauen, dass Sie uns mit dem Kauf eines Fahrzeugs entgegengebracht haben. Folgende Dokumente und Zubehör haben wir Ihnen verbunden mit dem Fahrzeug ausgehändigt.",
        ctx.margin,
        y,
        {
            size: 10,
            color: pdfTheme.colors.text,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 14,
        },
    );

    y -= 76;

    y = drawFormRow(ctx, {
        label: "Firma/Käufer:",
        value:
            [
                requireValue(data.customer.name),
                getCustomerAddress(data),
            ]
                .filter((item) => item !== "—")
                .join(", ") || "—",
        x: ctx.margin,
        y,
        rowHeight: 40,
    });

    y = drawFormRow(ctx, {
        label: "Fahrzeugtyp:",
        value: getVehicleType(data),
        x: ctx.margin,
        y,
        rowHeight: 36,
    });

    y = drawFormRow(ctx, {
        label: "Fahrgestellnummer/Fahrzeug-Nr.:",
        value: getVehicleNumber(data),
        x: ctx.margin,
        y,
        rowHeight: 42,
    });

    y = drawFormRow(ctx, {
        label: "Baujahr/Erstzulassung:",
        value: getConstructionYearAndFirstRegistration(data),
        x: ctx.margin,
        y,
        rowHeight: 38,
    });

    y -= 10;

    const checklistItems = [
        "Fahrzeugschein & Brief",
        "Fahrzeugschlüssel",
        "Fahrzeug",
    ];

    for (const item of checklistItems) {
        drawText(ctx, `- ${item}`, ctx.margin + 18, y, {
            size: 10,
            bold: true,
            color: pdfTheme.colors.text,
        });

        y -= 22;
    }

    y -= 8;

    drawText(ctx, "wurden Ihnen übergeben.", ctx.margin, y, {
        size: 10,
        color: pdfTheme.colors.text,
    });

    y -= 72;

    const signatureY = y;
    const signatureLineWidth = 230;

    drawText(ctx, "Unterschrift und Stempel", ctx.margin, signatureY + 28, {
        size: 10,
        bold: true,
        color: pdfTheme.colors.text,
    });

    drawSimpleLine(
        ctx,
        ctx.margin,
        signatureY,
        ctx.margin + signatureLineWidth,
        signatureY,
    );

    const dateX = ctx.margin + 310;

    drawText(ctx, `Datum: ${getDocumentDate(data)}`, dateX, signatureY + 28, {
        size: 10,
        bold: true,
        color: pdfTheme.colors.text,
    });

    drawSimpleLine(
        ctx,
        dateX,
        signatureY,
        ctx.width - ctx.margin,
        signatureY,
    );

    drawText(ctx, "WAW NUTZFAHRZEUGE", 215, 44, {
        size: 14,
        bold: true,
        color: "#8c8c8c",
    });

    return ctx.pdfDoc.save();
}