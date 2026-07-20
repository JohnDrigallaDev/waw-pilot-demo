"use client";

import { useId, useRef, useState, useTransition } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";

import {
    deleteVehicleDocumentAction,
    uploadVehicleDocumentAction,
} from "@/app/dashboard/vehicles/[vehicleId]/document-actions";
import { Button } from "@/components/ui/button";
import {
    getDocumentTooLargeMessage,
    getUnsupportedVehicleDocumentTypeMessage,
    isAllowedVehicleDocumentFile,
    maxDocumentFileSizeBytes,
    vehicleDocumentAcceptMimeTypes,
} from "@/lib/documents/upload-validation";

type VehicleDocumentUploadFormProps = {
    vehicleId: string;
    documentType: "vehicle_registration" | "purchase_invoice";
    documentLabel: string;
    existingDocumentId?: string | null;
};

function isNextRedirectError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;

    const maybeRedirectError = error as {
        message?: unknown;
        digest?: unknown;
    };

    return [maybeRedirectError.message, maybeRedirectError.digest].some(
        (value) => typeof value === "string" && value.includes("NEXT_REDIRECT"),
    );
}

export function VehicleDocumentUploadForm({
                                              vehicleId,
                                              documentType,
                                              documentLabel,
                                              existingDocumentId = null,
                                          }: VehicleDocumentUploadFormProps) {
    const inputId = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const hasExistingDocument = Boolean(existingDocumentId);

    function handleFileChange() {
        const formElement = formRef.current;
        const file = inputRef.current?.files?.[0] ?? null;

        if (!formElement) return;

        if (!(file instanceof File) || file.size <= 0) {
            setErrorMessage("Bitte wähle eine Datei aus.");
            return;
        }

        if (!isAllowedVehicleDocumentFile(file)) {
            setErrorMessage(getUnsupportedVehicleDocumentTypeMessage());
            setSelectedFileName(null);
            return;
        }

        if (file.size > maxDocumentFileSizeBytes) {
            setErrorMessage(getDocumentTooLargeMessage());
            setSelectedFileName(null);
            return;
        }

        const formData = new FormData(formElement);
        formData.set("file", file);
        setErrorMessage(null);
        setSelectedFileName(file.name);

        startTransition(async () => {
            try {
                await uploadVehicleDocumentAction(formData);
            } catch (error) {
                if (isNextRedirectError(error)) {
                    throw error;
                }

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Dokument konnte nicht hochgeladen werden.",
                );
                setSelectedFileName(null);
            }
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <form ref={formRef}>
                <input type="hidden" name="vehicle_id" value={vehicleId} />
                <input type="hidden" name="document_type" value={documentType} />
                {existingDocumentId ? (
                    <input
                        type="hidden"
                        name="existing_document_id"
                        value={existingDocumentId}
                    />
                ) : null}
                <input
                    ref={inputRef}
                    id={inputId}
                    name="file"
                    type="file"
                    accept={vehicleDocumentAcceptMimeTypes}
                    className="sr-only"
                    disabled={isPending}
                    onChange={handleFileChange}
                />
                <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    className="rounded-xl bg-slate-950 font-bold text-white hover:bg-slate-800"
                    onClick={() => inputRef.current?.click()}
                >
                    {isPending ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                    ) : (
                        <FileUp className="mr-1 size-3.5" />
                    )}
                    {hasExistingDocument ? "Ersetzen" : "Hochladen"}
                </Button>
            </form>

            {existingDocumentId ? (
                <form action={deleteVehicleDocumentAction}>
                    <input type="hidden" name="vehicle_id" value={vehicleId} />
                    <input type="hidden" name="document_id" value={existingDocumentId} />
                    <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-red-200 bg-white font-bold text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="mr-1 size-3.5" />
                        Entfernen
                    </Button>
                </form>
            ) : null}

            {selectedFileName ? (
                <p className="w-full text-xs font-semibold text-slate-500">
                    {selectedFileName}
                </p>
            ) : null}

            {errorMessage ? (
                <p className="w-full rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    {documentLabel}: {errorMessage}
                </p>
            ) : null}
        </div>
    );
}
