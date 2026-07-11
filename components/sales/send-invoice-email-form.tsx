"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Mail } from "lucide-react";

import { sendSaleInvoiceEmailAction } from "@/app/dashboard/sales/[saleId]/invoice-actions";
import { Button } from "@/components/ui/button";

type SendInvoiceEmailFormProps = {
    saleId: string;
    invoiceId: string;
};

export function SendInvoiceEmailForm({
    saleId,
    invoiceId,
}: SendInvoiceEmailFormProps) {
    return (
        <form action={sendSaleInvoiceEmailAction}>
            <input type="hidden" name="sale_id" value={saleId} />
            <input type="hidden" name="invoice_id" value={invoiceId} />
            <SubmitButton />
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            variant="outline"
            className="rounded-2xl bg-white font-bold"
        >
            {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
                <Mail className="mr-2 size-4" />
            )}
            {pending ? "Wird gesendet..." : "Per E-Mail senden"}
        </Button>
    );
}
