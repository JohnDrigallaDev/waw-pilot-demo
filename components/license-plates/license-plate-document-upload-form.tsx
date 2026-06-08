"use client";

import { useActionState, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";

import { uploadLicensePlateDocumentAction } from "@/app/dashboard/plates/[plateCaseId]/document-actions";

const initialState = {
    success: false,
    message: "",
};

type LicensePlateDocumentUploadFormProps = {
    plateCaseId: string;
    documentType: string;
    documentLabel: string;
    existingDocumentId: string | null;
    existingFileName: string | null;
};

export function LicensePlateDocumentUploadForm({
                                                   plateCaseId,
                                                   documentType,
                                                   documentLabel,
                                                   existingDocumentId,
                                                   existingFileName,
                                               }: LicensePlateDocumentUploadFormProps) {
    const [state, formAction, isPending] = useActionState(
        uploadLicensePlateDocumentAction,
        initialState,
    );

    const formRef = useRef<HTMLFormElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const displayFileName = selectedFileName ?? existingFileName;

    return (
        <form ref={formRef} action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="plate_case_id" value={plateCaseId} />
            <input type="hidden" name="document_type" value={documentType} />
            <input
                type="hidden"
                name="existing_document_id"
                value={existingDocumentId ?? ""}
            />

            <label
                className={
                    displayFileName
                        ? "group flex cursor-pointer items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                        : "group flex cursor-pointer items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/40 hover:shadow-md"
                }
            >
                <span
                    className={
                        displayFileName
                            ? "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
                            : "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700"
                    }
                >
                    {isPending ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : displayFileName ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <FileUp className="size-5" />
                    )}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-slate-950">
                        {displayFileName
                            ? `${documentLabel} ersetzen`
                            : `${documentLabel} hochladen`}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                        {isPending
                            ? "Wird hochgeladen..."
                            : displayFileName ?? "PDF, PNG, JPG oder WEBP"}
                    </span>
                </span>

                <span className="hidden rounded-xl bg-slate-950 px-3 py-2 text-xs font-extrabold text-white transition group-hover:bg-slate-800 sm:inline-flex">
                    Durchsuchen
                </span>

                <input
                    name="file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="sr-only"
                    disabled={isPending}
                    onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;

                        if (!file) return;

                        setSelectedFileName(file.name);

                        window.setTimeout(() => {
                            formRef.current?.requestSubmit();
                        }, 0);
                    }}
                />
            </label>

            {state.message ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                    {state.message}
                </div>
            ) : null}
        </form>
    );
}