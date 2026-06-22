"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";

import { deleteSaleDocumentAction } from "@/app/dashboard/sales/[saleId]/actions";

type DeleteSaleDocumentFormProps = {
    saleId: string;
    documentId: string;
};

export function DeleteSaleDocumentForm({
                                           saleId,
                                           documentId,
                                       }: DeleteSaleDocumentFormProps) {
    return (
        <form action={deleteSaleDocumentAction}>
            <input type="hidden" name="sale_id" value={saleId} />
            <input type="hidden" name="document_id" value={documentId} />
            <DeleteButton />
        </form>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {pending ? (
                <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
                <Trash2 className="mr-1 size-3.5" />
            )}
            {pending ? "Wird gelöscht..." : "Löschen"}
        </button>
    );
}
