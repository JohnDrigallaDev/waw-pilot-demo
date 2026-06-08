import { NextResponse } from "next/server";

import { getCurrentCompanyId } from "@/lib/company";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { getInvoicePdfData } from "@/lib/pdf/invoice-pdf-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        invoiceId: string;
    }>;
};

type InvoiceDocumentRelation = {
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
};

type SupabaseRelation<T> = T | T[] | null;

type InvoiceDocumentQueryResult = {
    invoice_number: string;
    pdf_document_id: string | null;
    documents: SupabaseRelation<InvoiceDocumentRelation>;
};

function getSingleRelation<T>(relation: SupabaseRelation<T>): T | null {
    if (!relation) return null;

    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation;
}

async function getStoredInvoicePdf(invoiceId: string) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("invoices")
        .select(
            `
      invoice_number,
      pdf_document_id,
      documents:pdf_document_id (
        file_name,
        file_path,
        mime_type
      )
    `,
        )
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) return null;

    const invoice = data as unknown as InvoiceDocumentQueryResult;
    const document = getSingleRelation(invoice.documents);

    if (!document?.file_path) return null;

    const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.file_path);

    if (downloadError || !fileData) return null;

    const arrayBuffer = await fileData.arrayBuffer();

    return {
        bytes: Buffer.from(arrayBuffer),
        fileName: document.file_name || `rechnung-${invoice.invoice_number}.pdf`,
        contentType: document.mime_type || "application/pdf",
    };
}

export async function GET(_request: Request, context: RouteContext) {
    const { invoiceId } = await context.params;

    const storedPdf = await getStoredInvoicePdf(invoiceId);

    if (storedPdf) {
        return new NextResponse(storedPdf.bytes, {
            headers: {
                "Content-Type": storedPdf.contentType,
                "Content-Disposition": `attachment; filename="${storedPdf.fileName}"`,
                "Cache-Control": "no-store",
            },
        });
    }

    try {
        const pdfData = await getInvoicePdfData(invoiceId);
        const pdfBytes = await generateInvoicePdf(pdfData);

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="rechnung-${pdfData.invoiceNumber}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "PDF konnte nicht erzeugt werden.",
            },
            { status: 500 },
        );
    }
}