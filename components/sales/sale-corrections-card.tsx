"use client";

import Link from "next/link";
import { Ban, CreditCard, FileX2, RotateCcw } from "lucide-react";

import {
    createCancellationInvoiceAction,
    registerSaleRefundAction,
} from "@/app/dashboard/sales/[saleId]/correction-actions";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { getInvoiceTypeLabel } from "@/lib/invoices/invoice-numbering";
import { getPaymentMethodLabel, paymentMethods } from "@/lib/payments/payment-methods";
import type {
    SaleDetailInvoice,
    SaleDetailRefund,
} from "@/lib/sales/sale-detail-queries";
import { correctionReasonDefinitions } from "@/src/modules/invoice-corrections/domain/constants/correction-types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/forms/form-field";
import { StatusBadge } from "@/components/shared/status-badge";

type SaleCorrectionsCardProps = {
    saleId: string;
    originalInvoice: SaleDetailInvoice | null;
    invoices: SaleDetailInvoice[];
    refunds: SaleDetailRefund[];
    summary: {
        original_invoice_id: string | null;
        existing_correction_gross_amount: number;
        remaining_correctable_amount: number;
        effective_invoice_amount: number;
        refunded_amount: number;
        outstanding_refund_amount: number;
        refund_status: string;
    };
};

export function SaleCorrectionsCard({
    saleId,
    originalInvoice,
    invoices,
    refunds,
    summary,
}: SaleCorrectionsCardProps) {
    const correctionInvoices = invoices.filter(
        (invoice) =>
            invoice.invoice_type === "cancellation_invoice" ||
            invoice.invoice_type === "credit_note",
    );
    const canCancel = Boolean(
        originalInvoice &&
            originalInvoice.invoice_type === "standard" &&
            summary.remaining_correctable_amount > 0,
    );
    const activeRefunds = refunds.filter((refund) => !refund.is_voided);

    return (
        <div id="invoice-corrections" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <FileX2 className="size-5 text-cyan-700" />
                        <h3 className="text-lg font-extrabold text-slate-950">
                            Rechnungskorrekturen
                        </h3>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Storno, Gutschrift und Rückzahlung werden als eigene Belege erfasst. Die Originalrechnung bleibt unverändert.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <CancellationDialog
                        saleId={saleId}
                        invoice={originalInvoice}
                        disabled={!canCancel}
                    />
                    <RefundDialog
                        saleId={saleId}
                        originalInvoice={originalInvoice}
                        correctionInvoice={
                            correctionInvoices.find(
                                (invoice) => invoice.invoice_type === "cancellation_invoice",
                            ) ?? null
                        }
                        outstandingRefundAmount={summary.outstanding_refund_amount}
                    />
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
                <SummaryBox label="Originalbetrag" value={formatCurrency(originalInvoice?.gross_amount ?? 0)} />
                <SummaryBox label="Korrigiert" value={formatCurrency(summary.existing_correction_gross_amount)} />
                <SummaryBox label="Wirksamer Betrag" value={formatCurrency(summary.effective_invoice_amount)} />
                <SummaryBox
                    label="Rückzahlung offen"
                    value={formatCurrency(summary.outstanding_refund_amount)}
                    highlight={summary.outstanding_refund_amount > 0}
                />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-extrabold text-slate-950">Korrekturbelege</h4>
                    <div className="mt-3 space-y-3">
                        {correctionInvoices.length > 0 ? (
                            correctionInvoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-extrabold text-slate-900">
                                            {getInvoiceTypeLabel(invoice.invoice_type)} {invoice.invoice_number}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-500">
                                            {formatDate(invoice.invoice_date)} · {formatCurrency(invoice.gross_amount)}
                                        </p>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="rounded-xl bg-white font-bold">
                                        <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                                            Öffnen
                                        </Link>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm font-semibold text-slate-500">
                                Noch kein Korrekturbeleg vorhanden.
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="font-extrabold text-slate-950">Rückzahlungen</h4>
                        <StatusBadge tone={summary.outstanding_refund_amount > 0 ? "warning" : "success"}>
                            {getRefundStatusLabel(summary.refund_status)}
                        </StatusBadge>
                    </div>
                    <div className="mt-3 space-y-3">
                        {activeRefunds.length > 0 ? (
                            activeRefunds.map((refund) => (
                                <div key={refund.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                    <p className="font-extrabold text-slate-900">
                                        {refund.refund_reference} · {formatCurrency(refund.amount)}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {formatDate(refund.refund_date)} · {getPaymentMethodLabel(refund.refund_method)}
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-slate-600">
                                        {refund.reason}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm font-semibold text-slate-500">
                                Noch keine Rückzahlung erfasst.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="font-extrabold text-slate-950">Korrekturhistorie</h4>
                <div className="mt-3 space-y-2">
                    {[
                        originalInvoice
                            ? `${formatDate(originalInvoice.invoice_date)} – Rechnung ${originalInvoice.invoice_number} erstellt (${formatCurrency(originalInvoice.gross_amount)})`
                            : null,
                        ...correctionInvoices.map(
                            (invoice) =>
                                `${formatDate(invoice.invoice_date)} – ${getInvoiceTypeLabel(invoice.invoice_type)} ${invoice.invoice_number} erstellt (${formatCurrency(invoice.gross_amount)})`,
                        ),
                        ...activeRefunds.map(
                            (refund) =>
                                `${formatDate(refund.refund_date)} – Rückzahlung ${refund.refund_reference} über ${formatCurrency(refund.amount)} erfasst`,
                        ),
                    ]
                        .filter((item): item is string => Boolean(item))
                        .map((item) => (
                            <p key={item} className="text-sm font-semibold text-slate-600">
                                {item}
                            </p>
                        ))}
                </div>
            </div>
        </div>
    );
}

function CancellationDialog({
    saleId,
    invoice,
    disabled,
}: {
    saleId: string;
    invoice: SaleDetailInvoice | null;
    disabled: boolean;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button disabled={disabled} variant="outline" className="rounded-2xl bg-white font-bold">
                    <Ban className="mr-2 size-4" />
                    Stornorechnung erstellen
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl bg-white">
                <form action={createCancellationInvoiceAction} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold text-slate-950">
                            Stornorechnung erstellen
                        </DialogTitle>
                        <DialogDescription>
                            Die Originalrechnung bleibt unverändert. Es wird ein neuer Korrekturbeleg mit eigener Rechnungsnummer erzeugt.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="sale_id" value={saleId} />
                    <input type="hidden" name="invoice_id" value={invoice?.id ?? ""} />
                    <FormField label="Korrekturgrund" name="reason_code" required>
                        <select
                            name="reason_code"
                            required
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"
                            defaultValue="contract_cancelled"
                        >
                            {correctionReasonDefinitions.map((reason) => (
                                <option key={reason.code} value={reason.code}>
                                    {reason.label}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Interne Begründung" name="reason_text">
                        <Textarea name="reason_text" rows={3} placeholder="Optionaler interner Hinweis" />
                    </FormField>
                    <FormField label="Kundenhinweis auf dem Beleg" name="customer_visible_reason">
                        <Textarea name="customer_visible_reason" rows={3} placeholder="Optionaler sichtbarer Hinweis" />
                    </FormField>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-cyan-700 font-bold text-white hover:bg-cyan-800">
                            Stornorechnung finalisieren
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RefundDialog({
    saleId,
    originalInvoice,
    correctionInvoice,
    outstandingRefundAmount,
}: {
    saleId: string;
    originalInvoice: SaleDetailInvoice | null;
    correctionInvoice: SaleDetailInvoice | null;
    outstandingRefundAmount: number;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    disabled={!originalInvoice || outstandingRefundAmount <= 0}
                    className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
                >
                    <RotateCcw className="mr-2 size-4" />
                    Rückzahlung erfassen
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl bg-white">
                <form action={registerSaleRefundAction} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold text-slate-950">
                            Rückzahlung erfassen
                        </DialogTitle>
                        <DialogDescription>
                            Offen rückzahlbar: {formatCurrency(outstandingRefundAmount)}. Eine Rückzahlung ist eine tatsächliche Geldbewegung.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="sale_id" value={saleId} />
                    <input type="hidden" name="invoice_id" value={originalInvoice?.id ?? ""} />
                    <input type="hidden" name="correction_invoice_id" value={correctionInvoice?.id ?? ""} />
                    <FormField label="Betrag" name="amount" required>
                        <Input
                            name="amount"
                            required
                            inputMode="decimal"
                            defaultValue={outstandingRefundAmount.toLocaleString("de-DE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        />
                    </FormField>
                    <FormField label="Datum" name="refund_date" required>
                        <Input name="refund_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                    </FormField>
                    <FormField label="Rückzahlungsart" name="refund_method" required>
                        <select
                            name="refund_method"
                            required
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold"
                            defaultValue="bank"
                        >
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="Grund" name="reason" required>
                        <Input name="reason" required placeholder="z. B. Rückzahlung nach Storno" />
                    </FormField>
                    <FormField label="Externe Referenz" name="external_reference">
                        <Input name="external_reference" placeholder="z. B. Bankreferenz" />
                    </FormField>
                    <FormField label="Notiz" name="note">
                        <Textarea name="note" rows={3} />
                    </FormField>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-cyan-700 font-bold text-white hover:bg-cyan-800">
                            <CreditCard className="mr-2 size-4" />
                            Rückzahlung speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SummaryBox({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className={highlight ? "rounded-2xl border border-amber-200 bg-amber-50 p-3" : "rounded-2xl border border-slate-200 bg-white p-3"}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-950">{value}</p>
        </div>
    );
}

function getRefundStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        NO_REFUND_REQUIRED: "Keine Rückzahlung",
        REFUND_REQUIRED: "Rückzahlung offen",
        PARTIALLY_REFUNDED: "Teilweise zurückgezahlt",
        FULLY_REFUNDED: "Vollständig zurückgezahlt",
        OVER_REFUNDED: "Überrückzahlung",
    };

    return labels[status] ?? status;
}
