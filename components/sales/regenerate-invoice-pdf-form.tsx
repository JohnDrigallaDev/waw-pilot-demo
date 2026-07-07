"use client";

import { useRef } from "react";
import { RefreshCcw } from "lucide-react";

import { regenerateSaleInvoicePdfAction } from "@/app/dashboard/sales/[saleId]/invoice-actions";
import { Button } from "@/components/ui/button";

type RegenerateInvoicePdfFormProps = {
    saleId: string;
    invoiceId: string;
};

export function RegenerateInvoicePdfForm({
                                             saleId,
                                             invoiceId,
                                         }: RegenerateInvoicePdfFormProps) {
    const includeSignatureStampInputRef = useRef<HTMLInputElement>(null);
    const includeDamageNotesInputRef = useRef<HTMLInputElement>(null);

    function handleSubmit() {
        const signatureCheckbox = document.getElementById(
            `sale-${saleId}-include-signature-stamp`,
        );
        const damageNotesCheckbox = document.getElementById(
            `sale-${saleId}-include-damage-notes`,
        );
        const includeSignatureStamp =
            signatureCheckbox instanceof HTMLInputElement &&
            signatureCheckbox.checked;
        const includeDamageNotes =
            damageNotesCheckbox instanceof HTMLInputElement &&
            damageNotesCheckbox.checked;

        if (includeSignatureStampInputRef.current) {
            includeSignatureStampInputRef.current.value = includeSignatureStamp
                ? "yes"
                : "no";
        }

        if (includeDamageNotesInputRef.current) {
            includeDamageNotesInputRef.current.value = includeDamageNotes
                ? "yes"
                : "no";
        }
    }

    return (
        <form action={regenerateSaleInvoicePdfAction} onSubmit={handleSubmit}>
            <input type="hidden" name="sale_id" value={saleId} />
            <input type="hidden" name="invoice_id" value={invoiceId} />
            <input
                ref={includeSignatureStampInputRef}
                type="hidden"
                name="include_signature_stamp"
                value="no"
            />
            <input
                ref={includeDamageNotesInputRef}
                type="hidden"
                name="include_damage_notes_on_invoice"
                value="no"
            />

            <Button
                type="submit"
                variant="outline"
                className="rounded-2xl bg-white font-bold"
            >
                <RefreshCcw className="mr-2 size-4" />
                PDF neu generieren
            </Button>
        </form>
    );
}
