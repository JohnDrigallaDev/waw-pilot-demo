"use client";

import { useId, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    getDocumentTooLargeMessage,
    getUnsupportedVehicleDocumentTypeMessage,
    isAllowedVehicleDocumentFile,
    maxDocumentFileSizeBytes,
    vehicleDocumentAcceptMimeTypes,
} from "@/lib/documents/upload-validation";
import { formatFileSize } from "@/lib/documents/document-helpers";

type VehicleDocumentUploadFieldsProps = {
    fields: {
        name: string;
        label: string;
        description: string;
    }[];
};

export function VehicleDocumentUploadFields({
                                                fields,
                                            }: VehicleDocumentUploadFieldsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
                <VehicleDocumentUploadField key={field.name} {...field} />
            ))}
        </div>
    );
}

function VehicleDocumentUploadField({
                                        name,
                                        label,
                                        description,
                                    }: VehicleDocumentUploadFieldsProps["fields"][number]) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    function handleFileChange() {
        const file = inputRef.current?.files?.[0] ?? null;

        if (!file) {
            setSelectedFile(null);
            setErrorMessage(null);
            return;
        }

        if (!isAllowedVehicleDocumentFile(file)) {
            resetFileInput();
            setErrorMessage(getUnsupportedVehicleDocumentTypeMessage());
            return;
        }

        if (file.size > maxDocumentFileSizeBytes) {
            resetFileInput();
            setErrorMessage(getDocumentTooLargeMessage());
            return;
        }

        setSelectedFile(file);
        setErrorMessage(null);
    }

    function resetFileInput() {
        if (inputRef.current) {
            inputRef.current.value = "";
        }

        setSelectedFile(null);
    }

    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700">
                    <FileUp className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-950">{label}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                    type="button"
                    className="h-10 rounded-2xl bg-slate-950 font-bold text-white hover:bg-slate-800"
                    onClick={() => inputRef.current?.click()}
                >
                    Hochladen
                </Button>

                {selectedFile ? (
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-2xl border-slate-200 bg-white font-bold"
                        onClick={resetFileInput}
                    >
                        <X className="mr-2 size-4" />
                        Entfernen
                    </Button>
                ) : null}
            </div>

            <input
                ref={inputRef}
                id={inputId}
                name={name}
                type="file"
                accept={vehicleDocumentAcceptMimeTypes}
                className="sr-only"
                onChange={handleFileChange}
            />

            {selectedFile ? (
                <p className="mt-3 truncate text-sm font-bold text-emerald-700">
                    {selectedFile.name} · {formatFileSize(selectedFile.size)}
                </p>
            ) : (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                    PDF, JPG, JPEG oder PNG bis 5 MB.
                </p>
            )}

            {errorMessage ? (
                <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}
