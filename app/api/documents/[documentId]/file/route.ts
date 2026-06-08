import { NextResponse } from "next/server";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        documentId: string;
    }>;
};

type DocumentFileQueryResult = {
    id: string;
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
};

function createSafeFileName(fileName: string): string {
    return fileName.replace(/"/g, "");
}

export async function GET(request: Request, context: RouteContext) {
    const { documentId } = await context.params;

    const url = new URL(request.url);
    const shouldDownload = url.searchParams.get("download") === "1";

    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("documents")
        .select(
            `
      id,
      file_name,
      file_path,
      mime_type
    `,
        )
        .eq("id", documentId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) {
        return NextResponse.json(
            {
                message: `Dokument konnte nicht geladen werden: ${
                    error?.message ?? "Nicht gefunden"
                }`,
            },
            { status: 404 },
        );
    }

    const document = data as unknown as DocumentFileQueryResult;

    if (!document.file_path) {
        return NextResponse.json(
            {
                message: "Dokument hat keinen Storage-Pfad.",
            },
            { status: 400 },
        );
    }

    const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

    if (downloadError || !fileData) {
        return NextResponse.json(
            {
                message: `Datei konnte nicht aus Storage geladen werden: ${
                    downloadError?.message ?? "Nicht gefunden"
                }`,
            },
            { status: 404 },
        );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const fileName = createSafeFileName(document.file_name);
    const contentType = document.mime_type || "application/octet-stream";
    const disposition = shouldDownload ? "attachment" : "inline";

    return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": `${disposition}; filename="${fileName}"`,
            "Cache-Control": "no-store",
        },
    });
}