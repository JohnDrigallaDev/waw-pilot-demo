import { readFile } from "node:fs/promises";
import path from "node:path";

import {
    createPdfLayout,
    drawHorizontalLine,
    drawPdfFooter,
    drawPdfHeader,
    drawSignatureLine,
    drawText,
} from "@/lib/pdf/core/pdf-layout";
import { pdfTheme } from "@/lib/pdf/core/pdf-theme";
import { formatPdfDate } from "@/lib/pdf/core/pdf-format";
import type { LicensePlateCaseDetail } from "@/lib/license-plates/license-plate-detail-queries";

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

function getPlateTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        short_term: "Kurzzeitkennzeichen",
        export: "Ausfuhrkennzeichen",
        red_plate: "Rotes Kennzeichen",
        transfer: "Überführungskennzeichen",
    };

    return labels[type] ?? type;
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

    await drawLogo(ctx);

    let y = drawPdfHeader(ctx, {
        title: "Einverständniserklärung",
        subtitle: "zur Nutzung von Kurzzeit- und Ausfuhrkennzeichen",
        documentNumber: getPlateTypeLabel(plateCase.plate_type),
    });

    drawText(
        ctx,
        "Consent Form for the Use of Temporary and Export License Plates",
        ctx.margin,
        y,
        {
            size: pdfTheme.fontSize.normal,
            bold: true,
            color: pdfTheme.colors.mutedText,
        },
    );

    y -= 36;

    drawText(ctx, "Kundendaten / Customer Information", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 26;

    const customerRows = [
        {
            label: "Name / Firma",
            value: plateCase.customer.name,
        },
        {
            label: "Adresse",
            value: plateCase.customer.address,
        },
        {
            label: "E-Mail",
            value: plateCase.customer.email ?? "—",
        },
        {
            label: "Telefon",
            value: plateCase.customer.phone ?? "—",
        },
    ];

    customerRows.forEach((row) => {
        drawText(ctx, row.label, ctx.margin, y, {
            size: pdfTheme.fontSize.small,
            bold: true,
            color: pdfTheme.colors.mutedText,
            maxWidth: 110,
        });

        drawText(ctx, row.value || "—", ctx.margin + 130, y, {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.text,
            maxWidth: ctx.width - ctx.margin * 2 - 130,
            lineHeight: 11,
        });

        y -= 20;
    });

    y -= 12;

    drawHorizontalLine(ctx, y + 8);

    drawText(ctx, "Fahrzeug / Vehicle", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 26;

    const vehicleRows = [
        {
            label: "Fahrzeug",
            value: `${plateCase.vehicle.internal_number} · ${plateCase.vehicle.name}`,
        },
        {
            label: "Fahrzeugtyp",
            value: plateCase.vehicle.vehicle_type,
        },
        {
            label: "FIN/VIN",
            value: plateCase.vehicle.vin,
        },
        {
            label: "Kennzeichen",
            value: plateCase.vehicle.license_plate ?? "—",
        },
        {
            label: "Kennzeichenart",
            value: getPlateTypeLabel(plateCase.plate_type),
        },
        {
            label: "Antragsdatum",
            value: formatPdfDate(plateCase.requested_at),
        },
    ];

    vehicleRows.forEach((row) => {
        drawText(ctx, row.label, ctx.margin, y, {
            size: pdfTheme.fontSize.small,
            bold: true,
            color: pdfTheme.colors.mutedText,
            maxWidth: 110,
        });

        drawText(ctx, row.value || "—", ctx.margin + 130, y, {
            size: pdfTheme.fontSize.small,
            color: pdfTheme.colors.text,
            maxWidth: ctx.width - ctx.margin * 2 - 130,
            lineHeight: 11,
        });

        y -= 20;
    });

    y -= 18;

    drawHorizontalLine(ctx, y + 8);

    drawText(ctx, "Erklärung / Declaration", ctx.margin, y, {
        size: pdfTheme.fontSize.large,
        bold: true,
        color: pdfTheme.colors.primaryDark,
    });

    y -= 28;

    const germanText =
        "Hiermit bestätigen der oben genannte Kunde bzw. Fahrer und die entsprechende Firma, dass sie von uns über die Nutzung der Kurzzeitkennzeichen bzw. Ausfuhrkennzeichen aufgeklärt wurden. Sie verpflichten sich ausdrücklich, die Kennzeichen ausschließlich innerhalb des Kreises Herzogtum Lauenburg zu verwenden. Eine Nutzung außerhalb dieses Gebietes ist nicht gestattet und erfolgt auf eigene Verantwortung.";

    drawText(ctx, germanText, ctx.margin, y, {
        size: pdfTheme.fontSize.normal,
        color: pdfTheme.colors.text,
        maxWidth: ctx.width - ctx.margin * 2,
        lineHeight: 14,
    });

    y -= 82;

    const englishText =
        "The above-named customer and/or driver hereby confirm that they have been informed about the proper use of the temporary and export license plates. They explicitly agree to use these plates only within the district of Herzogtum Lauenburg. Use outside this area is not permitted and will be at their own risk.";

    drawText(ctx, englishText, ctx.margin, y, {
        size: pdfTheme.fontSize.small,
        color: pdfTheme.colors.mutedText,
        maxWidth: ctx.width - ctx.margin * 2,
        lineHeight: 13,
    });

    y -= 84;

    drawText(ctx, `Datum / Date: ${formatPdfDate(new Date().toISOString())}`, ctx.margin, y, {
        size: pdfTheme.fontSize.normal,
        bold: true,
        color: pdfTheme.colors.text,
    });

    y -= 64;

    drawSignatureLine(
        ctx,
        ctx.margin,
        y,
        "Unterschrift / Signature Kunde oder Fahrer",
        240,
    );

    drawSignatureLine(
        ctx,
        ctx.width - ctx.margin - 220,
        y,
        "Name in Druckschrift",
        220,
    );

    drawPdfFooter(ctx);

    return ctx.pdfDoc.save();
}