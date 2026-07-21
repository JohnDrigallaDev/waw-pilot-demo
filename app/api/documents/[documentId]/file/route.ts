import { NextResponse } from "next/server";

import { getCurrentCompanyId } from "@/lib/company";
import { createDocumentUseCases } from "@/src/modules/documents/infrastructure/factories/document-use-case.factory";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        documentId: string;
    }>;
};

function createSafeFileName(fileName: string): string {
    return fileName.replace(/"/g, "");
}

export async function GET(request: Request, context: RouteContext) {
    const { documentId } = await context.params;

    const url = new URL(request.url);
    const shouldDownload = url.searchParams.get("download") === "1";
    const versionId = url.searchParams.get("versionId") ?? undefined;
    const companyId = getCurrentCompanyId();
    const { getDocumentDetail, generateDocumentAccessUrl } = createDocumentUseCases();

    let file;
    try {
        await getDocumentDetail.execute({ companyId, documentId });
        file = await generateDocumentAccessUrl.execute({
            companyId,
            documentId,
            versionId,
            expiresInSeconds: 60,
        });
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Dokument konnte nicht geladen werden.",
            },
            { status: 404 },
        );
    }

    const response = await fetch(file.signedUrl, { cache: "no-store" });

    if (!response.ok) {
        return NextResponse.json(
            {
                message: "Datei konnte nicht aus Storage geladen werden.",
            },
            { status: 404 },
        );
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileName = createSafeFileName(file.fileName);
    const contentType = file.mimeType || "application/octet-stream";
    const disposition = shouldDownload ? "attachment" : "inline";

    return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": `${disposition}; filename="${fileName}"`,
            "Cache-Control": "no-store",
        },
    });
}
