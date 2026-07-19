"use client";

import { useFormStatus } from "react-dom";
import { FilePlus2, Loader2, Mail } from "lucide-react";

import {
    createZugferdInvoiceAction,
    sendZugferdInvoiceEmailAction,
} from "@/app/dashboard/sales/[saleId]/invoice-actions";
import { Button } from "@/components/ui/button";

type ZugferdInvoiceActionsProps = {
    saleId: string;
    invoiceId: string;
    isValidated: boolean;
    isServiceConfigured: boolean;
};

export function ZugferdInvoiceActions({
    saleId,
    invoiceId,
    isValidated,
    isServiceConfigured,
}: ZugferdInvoiceActionsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <form action={createZugferdInvoiceAction}>
                <input type="hidden" name="sale_id" value={saleId} />
                <input type="hidden" name="invoice_id" value={invoiceId} />
                <CreateButton
                    isValidated={isValidated}
                    isServiceConfigured={isServiceConfigured}
                />
            </form>

            {isValidated ? (
                <form action={sendZugferdInvoiceEmailAction}>
                    <input type="hidden" name="sale_id" value={saleId} />
                    <input type="hidden" name="invoice_id" value={invoiceId} />
                    <SendButton />
                </form>
            ) : null}
        </div>
    );
}

function CreateButton({
    isValidated,
    isServiceConfigured,
}: {
    isValidated: boolean;
    isServiceConfigured: boolean;
}) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending || !isServiceConfigured}
            variant="outline"
            className="rounded-2xl bg-white font-bold"
            title={
                isServiceConfigured
                    ? undefined
                    : "ZUGFeRD-Service ist noch nicht eingerichtet."
            }
        >
            {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
                <FilePlus2 className="mr-2 size-4" />
            )}
            {pending
                ? "ZUGFeRD wird erstellt und validiert..."
                : isValidated
                  ? "Neu erstellen und prüfen"
                  : "ZUGFeRD erstellen und prüfen"}
        </Button>
    );
}

function SendButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
        >
            {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
                <Mail className="mr-2 size-4" />
            )}
            {pending ? "Wird gesendet..." : "ZUGFeRD per E-Mail senden"}
        </Button>
    );
}
