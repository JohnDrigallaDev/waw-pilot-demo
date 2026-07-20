import { NextResponse } from "next/server";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        asset: string;
    }>;
};

type CompanyAssetQueryResult = {
    signature_image_path: string | null;
    stamp_image_path: string | null;
    terms_pdf_path: string | null;
    terms_pdf_filename: string | null;
    terms_pdf_mime_type: string | null;
};

function getAssetPath(company: CompanyAssetQueryResult, asset: string) {
    if (asset === "signature") return company.signature_image_path;
    if (asset === "stamp") return company.stamp_image_path;
    if (asset === "terms") return company.terms_pdf_path;

    return null;
}

export async function GET(_request: Request, context: RouteContext) {
    const { asset } = await context.params;

    if (asset !== "signature" && asset !== "stamp" && asset !== "terms") {
        return NextResponse.json({ message: "Unbekannter Asset-Typ." }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("companies")
        .select("signature_image_path, stamp_image_path, terms_pdf_path, terms_pdf_filename, terms_pdf_mime_type")
        .eq("id", companyId)
        .single();

    if (error || !data) {
        return NextResponse.json(
            {
                message: `Firmendaten konnten nicht geladen werden: ${
                    error?.message ?? "Nicht gefunden"
                }`,
            },
            { status: 404 },
        );
    }

    const company = data as CompanyAssetQueryResult;
    const filePath = getAssetPath(company, asset);

    if (!filePath) {
        return NextResponse.json(
            { message: "Asset ist nicht hinterlegt." },
            { status: 404 },
        );
    }

    const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(filePath);

    if (downloadError || !fileData) {
        return NextResponse.json(
            {
                message: `Asset konnte nicht geladen werden: ${
                    downloadError?.message ?? "Nicht gefunden"
                }`,
            },
            { status: 404 },
        );
    }

    const headers: Record<string, string> = {
        "Content-Type":
            asset === "terms"
                ? company.terms_pdf_mime_type ?? "application/pdf"
                : fileData.type || "application/octet-stream",
        "Cache-Control": "no-store",
    };

    if (asset === "terms") {
        headers["Content-Disposition"] = `attachment; filename="${company.terms_pdf_filename ?? "agb.pdf"}"`;
    }

    return new NextResponse(Buffer.from(await fileData.arrayBuffer()), {
        headers: {
            ...headers,
        },
    });
}
