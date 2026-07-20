import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { getInvoicePdfData } from "@/lib/pdf/invoice-pdf-data";
import { buildFinalInvoicePdf, getCompanyTermsPdf } from "@/lib/pdf/company-terms";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InvoiceType } from "@/lib/invoices/invoice-numbering";

export type StoredInvoicePdfResult = {
    fileName: string;
    filePath: string;
    fileSize: number;
};

function getInvoiceFileBaseName(invoiceType: InvoiceType): string {
    const fileBaseNames: Record<InvoiceType, string> = {
        standard: "rechnung",
        proforma: "proforma-rechnung",
        down_payment: "anzahlungsrechnung",
    };

    return fileBaseNames[invoiceType];
}

export async function generateAndStoreInvoicePdf(
    invoiceId: string,
): Promise<StoredInvoicePdfResult> {
    const supabase = createServerSupabaseClient();

    const [pdfData, termsPdf] = await Promise.all([
        getInvoicePdfData(invoiceId),
        getCompanyTermsPdf(),
    ]);
    const invoicePdfBytes = await generateInvoicePdf({
        ...pdfData,
        termsAttached: Boolean(termsPdf),
    });
    const pdfBytes = await buildFinalInvoicePdf({
        invoicePdf: invoicePdfBytes,
        termsPdf: termsPdf?.bytes ?? null,
    });

    const fileBaseName = getInvoiceFileBaseName(pdfData.invoiceType);
    const fileName = `${fileBaseName}-${pdfData.invoiceNumber}.pdf`;
    const filePath = `invoices/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
        });

    if (uploadError) {
        throw new Error(`PDF konnte nicht gespeichert werden: ${uploadError.message}`);
    }

    return {
        fileName,
        filePath,
        fileSize: pdfBytes.byteLength,
    };
}
