"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Banknote,
    BookOpenCheck,
    Coins,
    Download,
    ExternalLink,
    Plus,
    Receipt,
    Search,
    ShoppingCart,
    Wallet,
} from "lucide-react";

import type { CashbookEntryRow } from "@/lib/cashbook/cashbook-queries";
import {
    calculateBalance,
    calculatePaymentMethodBalance,
    calculateTotalExpenses,
    calculateTotalIncome,
    getCashbookCategoryLabel,
    getCashbookPaymentMethodLabel,
    getCashbookTypeLabel,
    getCashbookTypeTone,
} from "@/lib/cashbook/cashbook-helpers";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type CashbookOverviewProps = {
    entries: CashbookEntryRow[];
};

type CashbookFilter = "all" | "cash" | "bank";
type EntryTypeFilter = "all" | "income" | "expense";

export function CashbookOverview({ entries }: CashbookOverviewProps) {
    const [query, setQuery] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<CashbookFilter>("all");
    const [entryTypeFilter, setEntryTypeFilter] =
        useState<EntryTypeFilter>("all");

    const filteredEntries = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return entries.filter((entry) => {
            const matchesPaymentFilter =
                paymentFilter === "all" || entry.payment_method === paymentFilter;

            const matchesEntryTypeFilter =
                entryTypeFilter === "all" || entry.entry_type === entryTypeFilter;

            if (!matchesPaymentFilter || !matchesEntryTypeFilter) return false;

            if (!normalizedQuery) return true;

            const searchableText = [
                entry.description,
                entry.vehicle_internal_number,
                entry.vehicle_name,
                entry.invoice_number,
                entry.purchase_number,
                entry.customer_name,
                getCashbookCategoryLabel(entry.category),
                getCashbookPaymentMethodLabel(entry.payment_method),
                getCashbookTypeLabel(entry.entry_type),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [query, entries, paymentFilter, entryTypeFilter]);

    const totalIncome = calculateTotalIncome(entries);
    const totalExpenses = calculateTotalExpenses(entries);
    const totalBalance = calculateBalance(entries);
    const cashBalance = calculatePaymentMethodBalance(entries, "cash");
    const bankBalance = calculatePaymentMethodBalance(entries, "bank");

    const purchaseExpenses = entries
        .filter(
            (entry) =>
                entry.entry_type === "expense" &&
                (entry.category === "vehicle_purchase" || entry.purchase_case_id),
        )
        .reduce((sum, entry) => sum + entry.amount, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Finanzen"
                title="Kassenbuch"
                description="Einnahmen, Ausgaben, Barbestand, Bankbestand und Zahlungsbewegungen aus Supabase."
                action={
                    <Button
                        asChild
                        className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
                    >
                        <Link href="/dashboard/cashbook/new">
                            <Plus className="mr-2 size-4" />
                            Buchung erfassen
                        </Link>
                    </Button>
                }
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <CashbookStatCard
                    label="Gesamtsaldo"
                    value={formatCurrency(totalBalance)}
                    description={`${formatCurrency(totalIncome)} Einnahmen · ${formatCurrency(totalExpenses)} Ausgaben`}
                    icon={BookOpenCheck}
                    tone={totalBalance >= 0 ? "success" : "danger"}
                />
                <CashbookStatCard
                    label="Barbestand"
                    value={formatCurrency(cashBalance)}
                    description="nur Barbuchungen"
                    icon={Coins}
                    tone={cashBalance >= 0 ? "success" : "danger"}
                />
                <CashbookStatCard
                    label="Bankbestand"
                    value={formatCurrency(bankBalance)}
                    description="nur Bankbuchungen"
                    icon={Banknote}
                    tone={bankBalance >= 0 ? "success" : "danger"}
                />
                <CashbookStatCard
                    label="Ankauf-Ausgaben"
                    value={formatCurrency(purchaseExpenses)}
                    description="Fahrzeugeinkäufe"
                    icon={ShoppingCart}
                    tone={purchaseExpenses > 0 ? "danger" : "success"}
                />
                <CashbookStatCard
                    label="Buchungen"
                    value={entries.length}
                    description="erfasste Bewegungen"
                    icon={Wallet}
                    tone="success"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="p-0">
                        <div className="border-b border-slate-200 bg-white p-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-950">
                                        Buchungsliste
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Kassenbuch mit Bezug zu Kunde, Fahrzeug, Verkauf, Ankauf, Rechnung und Beleg.
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-3 xl:max-w-3xl xl:flex-row">
                                    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
                                        <FilterButton
                                            active={paymentFilter === "all"}
                                            onClick={() => setPaymentFilter("all")}
                                        >
                                            Alle
                                        </FilterButton>
                                        <FilterButton
                                            active={paymentFilter === "cash"}
                                            onClick={() => setPaymentFilter("cash")}
                                        >
                                            Bar
                                        </FilterButton>
                                        <FilterButton
                                            active={paymentFilter === "bank"}
                                            onClick={() => setPaymentFilter("bank")}
                                        >
                                            Bank
                                        </FilterButton>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
                                        <FilterButton
                                            active={entryTypeFilter === "all"}
                                            onClick={() => setEntryTypeFilter("all")}
                                        >
                                            Alles
                                        </FilterButton>
                                        <FilterButton
                                            active={entryTypeFilter === "income"}
                                            onClick={() => setEntryTypeFilter("income")}
                                        >
                                            Einnahmen
                                        </FilterButton>
                                        <FilterButton
                                            active={entryTypeFilter === "expense"}
                                            onClick={() => setEntryTypeFilter("expense")}
                                        >
                                            Ausgaben
                                        </FilterButton>
                                    </div>

                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Buchung suchen..."
                                            className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="grid gap-4 p-4 md:hidden">
                                {filteredEntries.map((entry) => (
                                    <CashbookMobileCard key={entry.id} entry={entry} />
                                ))}

                                {filteredEntries.length === 0 ? <EmptyCashbookState /> : null}
                            </div>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[1120px] text-left">
                                    <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Datum</th>
                                        <th className="px-5 py-4">Typ</th>
                                        <th className="px-5 py-4">Kategorie</th>
                                        <th className="px-5 py-4">Beschreibung</th>
                                        <th className="px-5 py-4">Bezug</th>
                                        <th className="px-5 py-4">Zahlungsart</th>
                                        <th className="px-5 py-4 text-right">Betrag</th>
                                        <th className="px-5 py-4 text-right">Aktion</th>
                                    </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                    {filteredEntries.map((entry) => (
                                        <CashbookDesktopRow key={entry.id} entry={entry} />
                                    ))}
                                    </tbody>
                                </table>

                                {filteredEntries.length === 0 ? <EmptyCashbookState /> : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[1.75rem] border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
                        <CardContent className="p-6">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.32em] text-cyan-200">
                                    Zusammenfassung
                                </p>
                                <h2 className="mt-2 text-2xl font-extrabold">Kasse & Bank</h2>
                            </div>

                            <div className="mt-6 space-y-4">
                                <SummaryRow
                                    label="Einnahmen gesamt"
                                    value={formatCurrency(totalIncome)}
                                />
                                <SummaryRow
                                    label="Ausgaben gesamt"
                                    value={formatCurrency(totalExpenses)}
                                />
                                <SummaryRow
                                    label="Ankauf-Ausgaben"
                                    value={formatCurrency(purchaseExpenses)}
                                />
                                <SummaryRow label="Barbestand" value={formatCurrency(cashBalance)} />
                                <SummaryRow label="Bankbestand" value={formatCurrency(bankBalance)} />
                            </div>

                            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-4">
                                <p className="text-sm font-bold text-slate-200">
                                    Aktueller Gesamtsaldo
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-cyan-200">
                                    {formatCurrency(totalBalance)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        disabled
                        variant="outline"
                        className="h-12 w-full rounded-2xl border-slate-200 bg-white font-extrabold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download className="mr-2 size-4" />
                        Export später
                    </Button>
                </div>
            </section>
        </div>
    );
}

function CashbookDesktopRow({ entry }: { entry: CashbookEntryRow }) {
    const targetHref = getEntryTargetHref(entry);

    return (
        <tr
            onClick={() => {
                if (targetHref) {
                    window.location.href = targetHref;
                }
            }}
            className={
                targetHref
                    ? "group cursor-pointer bg-white transition-colors hover:bg-cyan-50/30"
                    : "group bg-white transition-colors hover:bg-slate-50"
            }
        >
            <td className="px-5 py-5">
                <p className="text-sm font-semibold text-slate-700">
                    {formatDate(entry.booking_date)}
                </p>
            </td>

            <td className="px-5 py-5">
                <StatusBadge tone={getCashbookTypeTone(entry.entry_type)}>
                    {getCashbookTypeLabel(entry.entry_type)}
                </StatusBadge>
            </td>

            <td className="px-5 py-5">
                <p className="font-bold text-slate-700">
                    {getCashbookCategoryLabel(entry.category)}
                </p>
            </td>

            <td className="px-5 py-5">
                <p className="max-w-xs font-semibold text-slate-950">
                    {entry.description}
                </p>
                {entry.customer_name ? (
                    <p className="mt-1 text-xs font-medium text-slate-500">
                        {entry.customer_name}
                    </p>
                ) : null}
            </td>

            <td className="px-5 py-5">
                <EntryReference entry={entry} />
            </td>

            <td className="px-5 py-5">
                <StatusBadge tone="neutral">
                    {getCashbookPaymentMethodLabel(entry.payment_method)}
                </StatusBadge>
            </td>

            <td className="px-5 py-5 text-right">
                <p
                    className={
                        entry.entry_type === "income"
                            ? "font-extrabold text-emerald-700"
                            : "font-extrabold text-red-700"
                    }
                >
                    {entry.entry_type === "income" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                </p>
            </td>

            <td
                className="px-5 py-5"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex justify-end gap-2">
                    <EntryDocumentButton entry={entry} />
                    <EntryTargetButton entry={entry} />
                </div>
            </td>
        </tr>
    );
}

function CashbookMobileCard({ entry }: { entry: CashbookEntryRow }) {
    const targetHref = getEntryTargetHref(entry);

    return (
        <div
            onClick={() => {
                if (targetHref) {
                    window.location.href = targetHref;
                }
            }}
            className={
                targetHref
                    ? "cursor-pointer rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.99]"
                    : "rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200"
            }
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <StatusBadge tone={getCashbookTypeTone(entry.entry_type)}>
                        {getCashbookTypeLabel(entry.entry_type)}
                    </StatusBadge>

                    <p className="mt-3 text-sm font-bold text-slate-500">
                        {formatDate(entry.booking_date)}
                    </p>
                </div>

                <p
                    className={
                        entry.entry_type === "income"
                            ? "text-right text-lg font-extrabold text-emerald-700"
                            : "text-right text-lg font-extrabold text-red-700"
                    }
                >
                    {entry.entry_type === "income" ? "+" : "-"}
                    {formatCurrency(entry.amount)}
                </p>
            </div>

            <div className="mt-4">
                <p className="text-base font-extrabold text-slate-950">
                    {entry.description}
                </p>
                {entry.customer_name ? (
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {entry.customer_name}
                    </p>
                ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Kategorie
                    </p>
                    <p className="text-sm font-extrabold text-slate-950">
                        {getCashbookCategoryLabel(entry.category)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Zahlungsart
                    </p>
                    <StatusBadge tone="neutral">
                        {getCashbookPaymentMethodLabel(entry.payment_method)}
                    </StatusBadge>
                </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Bezug
                </p>

                <div className="mt-1">
                    <EntryReference entry={entry} />
                </div>
            </div>

            <div
                className="mt-4 grid grid-cols-2 gap-2"
                onClick={(event) => event.stopPropagation()}
            >
                <EntryDocumentButton entry={entry} fullWidth />
                <EntryTargetButton entry={entry} fullWidth />
            </div>
        </div>
    );
}

function EntryReference({ entry }: { entry: CashbookEntryRow }) {
    return (
        <div className="space-y-1">
            {entry.purchase_case_id ? (
                <p className="font-bold text-orange-700">
                    Ankauf {entry.purchase_number ?? entry.purchase_case_id}
                </p>
            ) : null}

            {entry.sale_id ? (
                <p className="font-bold text-cyan-700">
                    Verkauf
                </p>
            ) : null}

            {entry.vehicle_internal_number ? (
                <p className="font-bold text-cyan-700">
                    {entry.vehicle_internal_number} · {entry.vehicle_name}
                </p>
            ) : null}

            {entry.invoice_number ? (
                <p className="text-xs font-semibold text-slate-500">
                    Rechnung {entry.invoice_number}
                </p>
            ) : null}

            {!entry.purchase_case_id &&
            !entry.sale_id &&
            !entry.vehicle_internal_number &&
            !entry.invoice_number ? (
                <span className="font-semibold text-slate-400">—</span>
            ) : null}
        </div>
    );
}

function EntryDocumentButton({
                                 entry,
                                 fullWidth = false,
                             }: {
    entry: CashbookEntryRow;
    fullWidth?: boolean;
}) {
    if (entry.document_id) {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className={
                    fullWidth
                        ? "h-11 w-full rounded-2xl font-bold"
                        : "rounded-xl font-bold"
                }
            >
                <Link href={`/api/documents/${entry.document_id}/file`} target="_blank">
                    <ExternalLink className="mr-1 size-3.5" />
                    Beleg
                </Link>
            </Button>
        );
    }

    if (entry.invoice_id) {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className={
                    fullWidth
                        ? "h-11 w-full rounded-2xl font-bold"
                        : "rounded-xl font-bold"
                }
            >
                <Link href={`/api/invoices/${entry.invoice_id}/pdf`} target="_blank">
                    <Receipt className="mr-1 size-3.5" />
                    Rechnung
                </Link>
            </Button>
        );
    }

    if (entry.purchase_case_id) {
        return (
            <Button
                asChild
                variant="outline"
                size="sm"
                className={
                    fullWidth
                        ? "h-11 w-full rounded-2xl font-bold"
                        : "rounded-xl font-bold"
                }
            >
                <Link href={`/dashboard/ankauf/${entry.purchase_case_id}`}>
                    <ShoppingCart className="mr-1 size-3.5" />
                    Ankauf
                </Link>
            </Button>
        );
    }

    return (
        <Button
            disabled
            variant="outline"
            size="sm"
            className={
                fullWidth
                    ? "h-11 w-full rounded-2xl font-bold"
                    : "rounded-xl font-bold"
            }
        >
            <Receipt className="mr-1 size-3.5" />
            Kein Beleg
        </Button>
    );
}

function EntryTargetButton({
                               entry,
                               fullWidth = false,
                           }: {
    entry: CashbookEntryRow;
    fullWidth?: boolean;
}) {
    const href = getEntryTargetHref(entry);

    return (
        <Button
            asChild={Boolean(href)}
            disabled={!href}
            size="sm"
            className={
                fullWidth
                    ? "h-11 w-full rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
                    : "rounded-xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
            }
        >
            {href ? (
                <Link href={href}>
                    Öffnen
                    <ExternalLink className="ml-1 size-3.5" />
                </Link>
            ) : (
                <span>Öffnen</span>
            )}
        </Button>
    );
}

function getEntryTargetHref(entry: CashbookEntryRow): string | null {
    if (entry.purchase_case_id) {
        return `/dashboard/ankauf/${entry.purchase_case_id}`;
    }

    if (entry.sale_id) {
        return `/dashboard/sales/${entry.sale_id}`;
    }

    if (entry.vehicle_id) {
        return `/dashboard/vehicles/${entry.vehicle_id}`;
    }

    if (entry.customer_id) {
        return `/dashboard/customers/${entry.customer_id}`;
    }

    return null;
}

function FilterButton({
                          active,
                          onClick,
                          children,
                      }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                active
                    ? "h-9 rounded-xl bg-white px-3 text-sm font-extrabold text-slate-950 shadow-sm"
                    : "h-9 rounded-xl px-3 text-sm font-extrabold text-slate-500 transition hover:text-slate-950"
            }
        >
            {children}
        </button>
    );
}

type CashbookStatCardProps = {
    label: string;
    value: string | number;
    description: string;
    icon: typeof Wallet;
    tone: "success" | "warning" | "danger";
};

function CashbookStatCard({
                              label,
                              value,
                              description,
                              icon: Icon,
                              tone,
                          }: CashbookStatCardProps) {
    const toneClasses = {
        success: "border-emerald-100 bg-emerald-50 text-emerald-700",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
        danger: "border-red-100 bg-red-50 text-red-700",
    };

    return (
        <Card className="group rounded-[1.5rem] border-slate-200 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-500">{label}</p>
                        <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">
                            {value}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                            {description}
                        </p>
                    </div>

                    <div
                        className={`flex size-11 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}
                    >
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm font-bold text-slate-300">{label}</p>
            <p className="font-extrabold text-white">{value}</p>
        </div>
    );
}

function EmptyCashbookState() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <BookOpenCheck className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                Keine Buchungen gefunden
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                Passe deine Suche an oder erfasse eine neue Buchung über einen Verkauf oder Ankauf.
            </p>
        </div>
    );
}