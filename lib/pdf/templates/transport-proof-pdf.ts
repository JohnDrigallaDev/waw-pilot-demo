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
import type { SaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";

function requireValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "—";

    const stringValue = String(value).trim();

    return stringValue.length > 0 ? stringValue : "—";
}

function getTransportTypeLabel(type: string | null | undefined): string {
    const labels: Record<string, string> = {
        self_pickup: "Abnehmer befördert selbst",
        customer_forwarder: "Spedition / Beauftragter des Abnehmers",
        seller_transport: "Lieferung durch WAW",
        other: "Sonstiges",
    };

    if (!type) return "—";

    return labels[type] ?? type;
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

function drawFieldRow(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    label: string,
    value: string,
    x: number,
    y: number,
    labelWidth = 165,
    valueWidth = 310,
): number {
    drawText(ctx, label, x, y, {
        size: pdfTheme.fontSize.small,
        bold: true,
        color: pdfTheme.colors.mutedText,
        maxWidth: labelWidth,
    });

    const finalY = drawText(ctx, value, x + labelWidth, y, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.text,
        maxWidth: valueWidth,
        lineHeight: 11,
    });

    return Math.min(y - 20, finalY - 20);
}

function drawCheckbox(
    ctx: Awaited<ReturnType<typeof createPdfLayout>>,
    x: number,
    y: number,
    label: string,
    checked: boolean,
): number {
    ctx.page.drawRectangle({
        x,
        y: y - 2,
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: hexToRgb(pdfTheme.colors.border),
    });

    if (checked) {
        drawText(ctx, "X", x + 2.2, y - 0.5, {
            size: 8,
            bold: true,
            color: pdfTheme.colors.primaryDark,
        });
    }

    drawText(ctx, label, x + 18, y, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.text,
        maxWidth: 430,
    });

    return y - 18;
}

export async function generateTransportProofPdf(
    data: SaleGeneratedDocumentData,
): Promise<Uint8Array> {
    if (!data.company || !data.customer || !data.vehicle || !data.sale || !data.export) {
        throw new Error(
            "Verbringungsnachweis konnte nicht erzeugt werden: Verkaufsdaten sind unvollständig.",
        );
    }

    const ctx = await createPdfLayout();

    await drawLogo(ctx);

    let y = drawPdfHeader(ctx, {
        title: "Verbringungsnachweis / Empfangsbestätigung",
        subtitle:
            "Nachweis über die Verbringung des Fahrzeugs in das übrige Gemeinschaftsgebiet",
        documentNumber: data.sale.invoiceNumber
            ? `Rechnung ${data.sale.invoiceNumber}`
            : null,
    });

    drawText(ctx, "Angaben zum Fahrzeug", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    const vehicleDescription = [
        data.vehicle.manufacturer,
        data.vehicle.model,
        data.vehicle.vehicleType,
    ]
        .filter(Boolean)
        .join(" ");

    y = drawFieldRow(
        ctx,
        "Fahrzeugtyp",
        requireValue(vehicleDescription),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Fahrgestellnummer / VIN",
        requireValue(data.vehicle.vin),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Interne Fahrzeugnummer",
        requireValue(data.vehicle.internalNumber),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Rechnung",
        data.sale.invoiceNumber
            ? `${data.sale.invoiceNumber} vom ${formatPdfDate(data.sale.invoiceDate)}`
            : "—",
        ctx.margin,
        y,
    );

    y -= 8;
    drawHorizontalLine(ctx, y + 10);

    drawText(ctx, "Angaben zur Verbringung", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    y = drawFieldRow(
        ctx,
        "Verbringungs- / Übergabedatum",
        formatPdfDate(data.export.transportDate),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Übergabeort / Empfangsort",
        requireValue(data.export.destinationCity),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Empfangsland",
        requireValue(data.export.destinationCountry),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Art der Verbringung",
        getTransportTypeLabel(data.export.transportType),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Empfänger / Unterzeichner",
        requireValue(data.export.receiverName),
        ctx.margin,
        y,
    );

    y -= 8;
    drawHorizontalLine(ctx, y + 10);

    drawText(ctx, "Abnehmer / Empfänger", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    y = drawFieldRow(
        ctx,
        "Name",
        requireValue(data.customer.name),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "Adresse",
        requireValue(
            [
                data.customer.street,
                [data.customer.postalCode, data.customer.city]
                    .filter(Boolean)
                    .join(" "),
                data.customer.country,
            ]
                .filter(Boolean)
                .join(", "),
        ),
        ctx.margin,
        y,
    );

    y = drawFieldRow(
        ctx,
        "USt-ID",
        requireValue(data.customer.vatId),
        ctx.margin,
        y,
    );

    y -= 8;
    drawHorizontalLine(ctx, y + 10);

    drawText(ctx, "Bestätigung", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 24;

    drawText(
        ctx,
        "Hiermit wird bestätigt, dass das oben genannte Fahrzeug übernommen und in das oben genannte Empfangsland verbracht wurde bzw. verbracht wird.",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 13,
        },
    );

    y -= 42;

    drawText(ctx, "Transportart", ctx.margin, y, {
        size: pdfTheme.fontSize.normal,
        bold: true,
        color: pdfTheme.colors.text,
    });

    y -= 22;

    y = drawCheckbox(
        ctx,
        ctx.margin,
        y,
        "Abnehmer befördert das Fahrzeug selbst.",
        data.export.transportType === "self_pickup",
    );

    y = drawCheckbox(
        ctx,
        ctx.margin,
        y,
        "Spedition / Beauftragter des Abnehmers übernimmt die Verbringung.",
        data.export.transportType === "customer_forwarder",
    );

    y = drawCheckbox(
        ctx,
        ctx.margin,
        y,
        "Lieferung erfolgt durch WAW Nutzfahrzeuge.",
        data.export.transportType === "seller_transport",
    );

    y = drawCheckbox(
        ctx,
        ctx.margin,
        y,
        "Sonstige Verbringung.",
        data.export.transportType === "other",
    );

    y -= 26;

    drawText(
        ctx,
        "Die Angaben sind vom Abnehmer, Empfänger oder dessen Beauftragten zu bestätigen. Eine unterschriebene Version ist zur Verkaufsakte hochzuladen.",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.mutedText,
            maxWidth: ctx.width - ctx.margin * 2,
            lineHeight: 12,
        },
    );

    y -= 58;

    drawText(
        ctx,
        `Ausstellungsdatum: ${formatPdfDate(new Date().toISOString())}`,
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            bold: true,
        },
    );

    y -= 62;

    drawSignatureLine(
        ctx,
        ctx.margin,
        y,
        "Ort, Datum, Unterschrift / Stempel Abnehmer oder Beauftragter",
        250,
    );

    drawSignatureLine(
        ctx,
        ctx.width - ctx.margin - 210,
        y,
        "Name in Druckschrift",
        210,
    );

    drawPdfFooter(ctx);

    return ctx.pdfDoc.save();
}