"use client";

import { useMemo } from "react";
import { Edit3, Plus, Undo2, Wallet } from "lucide-react";

import {
    createSalePaymentAction,
    updateSalePaymentAction,
    voidSalePaymentAction,
} from "@/app/dashboard/sales/[saleId]/payment-actions";
import type { SaleDetailPayment } from "@/lib/sales/sale-detail-queries";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import {
    getPaymentMethodLabel,
    paymentMethods,
} from "@/lib/payments/payment-methods";
import {
    getPaymentStatusLabel,
    getPaymentStatusTone,
} from "@/lib/sales/sale-helpers";
import type { PaymentStatus } from "@/lib/sales/sale-queries";
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

type SalePaymentsCardProps = {
    saleId: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: PaymentStatus;
    payments: SaleDetailPayment[];
};

export function SalePaymentsCard({
    saleId,
    totalAmount,
    paidAmount,
    remainingAmount,
    paymentStatus,
    payments,
}: SalePaymentsCardProps) {
    const activePayments = payments.filter((payment) => !payment.is_voided);
    const voidedPayments = payments.filter((payment) => payment.is_voided);

    return (
        <div id="payments" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Wallet className="size-5 text-cyan-700" />
                        <h3 className="text-lg font-extrabold text-slate-950">
                            Zahlungen
                        </h3>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Bar- und Bankzahlungen werden einzeln erfasst und revisionssicher protokolliert.
                    </p>
                </div>
                <AddPaymentDialog
                    saleId={saleId}
                    remainingAmount={remainingAmount}
                />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
                <PaymentSummaryBox label="Gesamtbetrag" value={formatCurrency(totalAmount)} />
                <PaymentSummaryBox label="Bezahlt" value={formatCurrency(paidAmount)} />
                <PaymentSummaryBox
                    label={remainingAmount < 0 ? "Überzahlung" : "Restbetrag"}
                    value={formatCurrency(Math.abs(remainingAmount))}
                    highlight={remainingAmount !== 0}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Zahlungsstatus
                    </p>
                    <div className="mt-2">
                        <StatusBadge tone={getPaymentStatusTone(paymentStatus)}>
                            {getPaymentStatusLabel(paymentStatus)}
                        </StatusBadge>
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {activePayments.length > 0 ? (
                    activePayments.map((payment) => (
                        <PaymentRow
                            key={payment.id}
                            saleId={saleId}
                            payment={payment}
                        />
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                        Noch keine Zahlung erfasst.
                    </div>
                )}
            </div>

            {voidedPayments.length > 0 ? (
                <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-extrabold text-slate-700">
                        Historie stornierter Zahlungen ({voidedPayments.length})
                    </summary>
                    <div className="mt-3 space-y-3">
                        {voidedPayments.map((payment) => (
                            <div
                                key={payment.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-extrabold text-slate-700">
                                            {payment.payment_reference} · {formatCurrency(payment.amount)}
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-500">
                                            {formatDate(payment.payment_date)} · {getPaymentMethodLabel(payment.payment_method)}
                                        </p>
                                    </div>
                                    <StatusBadge tone="neutral">Storniert</StatusBadge>
                                </div>
                                {payment.void_reason ? (
                                    <p className="mt-2 font-semibold text-slate-500">
                                        Grund: {payment.void_reason}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </details>
            ) : null}
        </div>
    );
}

function AddPaymentDialog({
    saleId,
    remainingAmount,
}: {
    saleId: string;
    remainingAmount: number;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800">
                    <Plus className="mr-2 size-4" />
                    Zahlung hinzufügen
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl bg-white">
                <form action={createSalePaymentAction} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold text-slate-950">
                            Zahlung hinzufügen
                        </DialogTitle>
                        <DialogDescription>
                            Restbetrag aktuell: {formatCurrency(remainingAmount)}
                        </DialogDescription>
                    </DialogHeader>
                    <PaymentFields saleId={saleId} defaultAmount={Math.max(remainingAmount, 0)} />
                    <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                        <input
                            type="checkbox"
                            name="overpayment_confirmed"
                            value="yes"
                            className="mt-1 size-4 rounded border-amber-300"
                        />
                        Überzahlung bewusst speichern, falls der Betrag den Restbetrag überschreitet.
                    </label>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-cyan-700 font-bold text-white hover:bg-cyan-800">
                            Zahlung speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PaymentRow({
    saleId,
    payment,
}: {
    saleId: string;
    payment: SaleDetailPayment;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="font-extrabold text-slate-950">
                        {payment.payment_reference} · {formatCurrency(payment.amount)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatDate(payment.payment_date)} · {getPaymentMethodLabel(payment.payment_method)}
                    </p>
                    {payment.note ? (
                        <p className="mt-1 text-sm font-medium text-slate-600">
                            {payment.note}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                    <EditPaymentDialog saleId={saleId} payment={payment} />
                    <VoidPaymentDialog saleId={saleId} payment={payment} />
                </div>
            </div>
        </div>
    );
}

function EditPaymentDialog({
    saleId,
    payment,
}: {
    saleId: string;
    payment: SaleDetailPayment;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl bg-white font-bold">
                    <Edit3 className="mr-1 size-3.5" />
                    Bearbeiten
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl bg-white">
                <form action={updateSalePaymentAction} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold text-slate-950">
                            Zahlung bearbeiten
                        </DialogTitle>
                        <DialogDescription>
                            Referenz {payment.payment_reference} bleibt unverändert.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="payment_id" value={payment.id} />
                    <PaymentFields saleId={saleId} payment={payment} />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </DialogClose>
                        <Button type="submit" className="bg-cyan-700 font-bold text-white hover:bg-cyan-800">
                            Änderung speichern
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function VoidPaymentDialog({
    saleId,
    payment,
}: {
    saleId: string;
    payment: SaleDetailPayment;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl border-red-200 bg-white font-bold text-red-700 hover:bg-red-50">
                    <Undo2 className="mr-1 size-3.5" />
                    Stornieren
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl bg-white">
                <form action={voidSalePaymentAction} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold text-slate-950">
                            Zahlung stornieren
                        </DialogTitle>
                        <DialogDescription>
                            Die Zahlung bleibt in der Historie sichtbar und wird nicht mehr in die Summe eingerechnet.
                        </DialogDescription>
                    </DialogHeader>
                    <input type="hidden" name="sale_id" value={saleId} />
                    <input type="hidden" name="payment_id" value={payment.id} />
                    <FormField label="Grund der Stornierung" name="void_reason" required>
                        <Textarea
                            id="void_reason"
                            name="void_reason"
                            required
                            className="min-h-24 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                        />
                    </FormField>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Abbrechen
                            </Button>
                        </DialogClose>
                        <Button type="submit" variant="destructive" className="font-bold">
                            Zahlung stornieren
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PaymentFields({
    saleId,
    payment,
    defaultAmount,
}: {
    saleId: string;
    payment?: SaleDetailPayment;
    defaultAmount?: number;
}) {
    const amountValue = useMemo(
        () => String(payment?.amount ?? defaultAmount ?? "").replace(".", ","),
        [defaultAmount, payment?.amount],
    );

    return (
        <>
            <input type="hidden" name="sale_id" value={saleId} />
            <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Betrag" name="amount" required>
                    <Input
                        id="amount"
                        name="amount"
                        inputMode="decimal"
                        defaultValue={amountValue}
                        required
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                    />
                </FormField>
                <FormField label="Zahlungsdatum" name="payment_date" required>
                    <Input
                        id="payment_date"
                        name="payment_date"
                        type="date"
                        defaultValue={payment?.payment_date ?? new Date().toISOString().slice(0, 10)}
                        required
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                    />
                </FormField>
                <FormField label="Zahlungsart" name="payment_method" required>
                    <select
                        id="payment_method"
                        name="payment_method"
                        defaultValue={payment?.payment_method ?? "bank"}
                        required
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 font-medium text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    >
                        {paymentMethods.map((method) => (
                            <option key={method.value} value={method.value}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Externe Referenz" name="external_reference">
                    <Input
                        id="external_reference"
                        name="external_reference"
                        defaultValue={payment?.external_reference ?? ""}
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                    />
                </FormField>
            </div>
            <FormField label="Notiz" name="note">
                <Textarea
                    id="note"
                    name="note"
                    defaultValue={payment?.note ?? ""}
                    className="min-h-24 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                />
            </FormField>
        </>
    );
}

function PaymentSummaryBox({
    label,
    value,
    highlight = false,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p
                className={
                    highlight
                        ? "mt-1 text-lg font-extrabold text-cyan-700"
                        : "mt-1 text-lg font-extrabold text-slate-950"
                }
            >
                {value}
            </p>
        </div>
    );
}
