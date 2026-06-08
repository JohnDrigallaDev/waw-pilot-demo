"use client";

import { useFormStatus } from "react-dom";
import { FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type GenerateSaleDocumentSubmitButtonProps = {
    disabled: boolean;
};

export function GenerateSaleDocumentSubmitButton({
                                                     disabled,
                                                 }: GenerateSaleDocumentSubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={disabled || pending}
            className="h-11 w-full rounded-2xl bg-cyan-700 font-extrabold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
                <FileText className="mr-2 size-4" />
            )}
            {pending ? "Wird erzeugt..." : "Erzeugen"}
        </Button>
    );
}