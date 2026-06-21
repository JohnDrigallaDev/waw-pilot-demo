"use client";

import { useId, useRef, useState, useTransition } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";

import { uploadSaleDocumentAction } from "@/app/dashboard/sales/[saleId]/actions";

type SaleDocumentUploadFormProps = {
    saleId: string;
    documentType: string;
    documentLabel: string;
    existingDocumentId?: string | null;
    existingFileName?: string | null;
};

export function SaleDocumentUploadForm({
                                           saleId,
                                           documentType,
                                           documentLabel,
                                           existingDocumentId = null,
                                           existingFileName = null,
                                       }: SaleDocumentUploadFormProps) {
    const inputId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const hasExistingDocument = Boolean(existingDocumentId);
    const displayFileName = selectedFileName ?? existingFileName;

    function handleFileChange() {
        const formElement = formRef.current;

        if (!formElement) return;

        const formData = new FormData(formElement);
        const file = formData.get("file");

        if (!(file instanceof File) || file.size === 0) return;

        setSelectedFileName(file.name);

        startTransition(async () => {
            await uploadSaleDocumentAction(formData);
        });
    }

    return (
        <form
            ref={formRef}
            className={
                hasExistingDocument
                    ? "mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm"
                    : "mt-4 rounded-3xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm"
            }
        >
            <input type="hidden" name="sale_id" value={saleId} />
            <input type="hidden" name="document_type" value={documentType} />
            <input type="hidden" name="document_label" value={documentLabel} />

            {existingDocumentId ? (
                <input
                    type="hidden"
                    name="existing_document_id"
                    value={existingDocumentId}
                />
            ) : null}

            <label
                htmlFor={inputId}
                className={
                    hasExistingDocument
                        ? "group flex cursor-pointer items-center gap-4 rounded-2xl border border-emerald-200 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                        : "group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
                }
            >
                <span
                    className={
                        isPending
                            ? "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
                            : hasExistingDocument
                                ? "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
                                : "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-200"
                    }
                >
                    {isPending ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : hasExistingDocument ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <FileUp className="size-5" />
                    )}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-slate-950">
                        {isPending
                            ? "Datei wird hochgeladen..."
                            : hasExistingDocument
                                ? "Dokument ersetzen"
                                : selectedFileName
                                    ? "Datei wird vorbereitet..."
                                    : "Datei auswählen"}
                    </span>

                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                        {isPending
                            ? selectedFileName ?? "Bitte kurz warten"
                            : hasExistingDocument
                                ? displayFileName ?? "Aktuell gespeicherte Datei ersetzen"
                                : selectedFileName ?? "PDF, PNG, JPG oder WEBP"}
                    </span>
                </span>

                <span
                    className={
                        hasExistingDocument
                            ? "hidden rounded-xl bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white transition group-hover:bg-emerald-800 sm:inline-flex"
                            : "hidden rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white transition group-hover:bg-slate-800 sm:inline-flex"
                    }
                >
                    {hasExistingDocument ? "Ersetzen" : "Durchsuchen"}
                </span>

                <input
                    id={inputId}
                    name="file"
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="sr-only"
                    disabled={isPending}
                    onChange={handleFileChange}
                />
            </label>
        </form>
    );
}