import { readFile } from "node:fs/promises";
import path from "node:path";

import { PDFDocument, type PDFImage } from "pdf-lib";

import {
    drawHorizontalLine,
    drawText,
    type PdfLayoutContext,
} from "@/lib/pdf/core/pdf-layout";
import { pdfTheme } from "@/lib/pdf/core/pdf-theme";
import type { SaleGeneratedDocumentData } from "@/lib/pdf/generated-documents/sale-document-data";

export type CompanyDocumentIdentity = {
    legalName: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    email: string;
    website: string;
};

const fallbackCompanyIdentity: CompanyDocumentIdentity = {
    legalName: "WAW Nutzfahrzeuge e.K.",
    street: "Billstraße 82",
    postalCode: "20539",
    city: "Hamburg",
    country: "Deutschland",
    email: "info@waw-nutzfahrzeuge.de",
    website: "www.waw-nutzfahrzeuge.de",
};

let cachedLogoBytes: Uint8Array | null = null;

export function resolveCompanyDocumentIdentity(
    data: SaleGeneratedDocumentData,
): CompanyDocumentIdentity {
    const company = data.company;

    return {
        legalName: company?.legalName?.trim() || fallbackCompanyIdentity.legalName,
        street: company?.street?.trim() || fallbackCompanyIdentity.street,
        postalCode:
            company?.postalCode?.trim() || fallbackCompanyIdentity.postalCode,
        city: company?.city?.trim() || fallbackCompanyIdentity.city,
        country: company?.country?.trim() || fallbackCompanyIdentity.country,
        email: company?.email?.trim() || fallbackCompanyIdentity.email,
        website: company?.website?.trim() || fallbackCompanyIdentity.website,
    };
}

async function getLogoBytes(): Promise<Uint8Array | null> {
    if (cachedLogoBytes) return cachedLogoBytes;

    try {
        cachedLogoBytes = await readFile(
            path.join(process.cwd(), "public", "brand", "waw-logo.png"),
        );
        return cachedLogoBytes;
    } catch {
        return null;
    }
}

async function embedLogo(pdfDoc: PDFDocument): Promise<PDFImage | null> {
    const logoBytes = await getLogoBytes();

    if (!logoBytes) return null;

    return pdfDoc.embedPng(logoBytes);
}

export async function drawCompanyDocumentHeader(
    ctx: PdfLayoutContext,
    data: SaleGeneratedDocumentData,
): Promise<number> {
    const identity = resolveCompanyDocumentIdentity(data);
    const logoImage = await embedLogo(ctx.pdfDoc);
    const topY = ctx.height - ctx.margin + 4;

    if (logoImage) {
        const logoWidth = 126;
        const logoHeight = Math.min(
            58,
            (logoImage.height / logoImage.width) * logoWidth,
        );

        ctx.page.drawImage(logoImage, {
            x: ctx.margin,
            y: topY - logoHeight,
            width: logoWidth,
            height: logoHeight,
        });
    } else {
        drawText(ctx, "WAW", ctx.margin, topY - 24, {
            size: 20,
            bold: true,
            color: pdfTheme.colors.primaryDark,
        });
    }

    const blockX = ctx.width - ctx.margin - 195;
    let y = topY - 8;

    drawText(ctx, identity.legalName, blockX, y, {
        size: 10,
        bold: true,
        color: pdfTheme.colors.text,
        maxWidth: 195,
        lineHeight: 12,
    });

    y -= 16;

    [
        identity.street,
        `${identity.postalCode} ${identity.city}`.trim(),
        identity.email,
        identity.website,
    ].forEach((line) => {
        drawText(ctx, line, blockX, y, {
            size: 8,
            color: pdfTheme.colors.mutedText,
            maxWidth: 195,
            lineHeight: 10,
        });
        y -= 11;
    });

    const bottomY = ctx.height - ctx.margin - 72;
    drawHorizontalLine(ctx, bottomY, {
        color: pdfTheme.colors.lightBorder,
        thickness: 0.75,
    });

    return bottomY - 28;
}
