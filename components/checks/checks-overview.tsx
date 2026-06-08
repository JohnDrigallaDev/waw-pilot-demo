import Link from "next/link";
import {
    ArrowUpRight,
    BadgeCheck,
    CheckCircle2,
    ClipboardCheck,
    FileArchive,
    FileWarning,
    Receipt,
    ShoppingCart,
} from "lucide-react";

import type { ChecksData } from "@/lib/checks/checks-queries";
import { getDocumentStatusLabel, getDocumentStatusTone, getDocumentTypeLabel } from "@/lib/documents/document-helpers";
import {
    getInvoicePaymentStatusLabel,
    getInvoicePaymentStatusTone,
} from "@/lib/invoices/invoice-helpers";
import {
    getLicensePlateStatusLabel,
    getLicensePlateStatusTone,
    getLicensePlateTypeLabel,
} from "@/lib/license-plates/license-plate-helpers";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    getPurchaseDocumentStatusLabel,
    getPurchaseDocumentStatusTone,
    getPurchasePaymentStatusLabel,
    getPurchasePaymentStatusTone,
} from "@/lib/purchases/purchase-helpers";

type ChecksOverviewProps = {
    data: ChecksData;
};

export function ChecksOverview({ data }: ChecksOverviewProps) {
    const totalOpenItems =
        data.openInvoicesCount +
        data.documentsToCheckCount +
        data.openLicensePlateCasesCount +
        data.salesToCheckCount +
        data.purchaseCasesToCheckCount;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Pflichtprüfung"
                title="Kontrollzentrum"
                description="Offene Rechnungen, fehlende Dokumente, Kennzeichen-Vorgänge und unvollständige Verkaufsakten zentral prüfen."
                action={
                    <Button
                        asChild
                        className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
                    >
                        <Link href="/dashboard/documents">
                            Dokumente öffnen
                            <ArrowUpRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                }
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <CheckStatCard
                    label="Gesamt offen"
                    value={totalOpenItems}
                    description="alle erkannten Prüfpunkte"
                    icon={ClipboardCheck}
                    danger={totalOpenItems > 0}
                />
                <CheckStatCard
                    label="Offene Rechnungen"
                    value={data.openInvoicesCount}
                    description="nicht bezahlt"
                    icon={Receipt}
                    href="/dashboard/invoices"
                    danger={data.openInvoicesCount > 0}
                />
                <CheckStatCard
                    label="Dokumente prüfen"
                    value={data.documentsToCheckCount}
                    description="fehlend oder needs_review"
                    icon={FileWarning}
                    href="/dashboard/documents"
                    danger={data.documentsToCheckCount > 0}
                />
                <CheckStatCard
                    label="Kennzeichen offen"
                    value={data.openLicensePlateCasesCount}
                    description="offen oder beantragt"
                    icon={BadgeCheck}
                    href="/dashboard/plates"
                    danger={data.openLicensePlateCasesCount > 0}
                />
                <CheckStatCard
                    label="Ankäufe prüfen"
                    value={data.purchaseCasesToCheckCount}
                    description="Zahlung oder Dokumente offen"
                    icon={ShoppingCart}
                    href="/dashboard/ankauf"
                    danger={data.purchaseCasesToCheckCount > 0}
                />
            </section>

            {totalOpenItems === 0 ? (
                <Card className="rounded-[1.75rem] border-emerald-100 bg-emerald-50 shadow-sm">
                    <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                        <div className="flex size-16 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm">
                            <CheckCircle2 className="size-8" />
                        </div>
                        <h2 className="mt-5 text-2xl font-extrabold text-emerald-950">
                            Alles sauber
                        </h2>
                        <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-emerald-800">
                            Aktuell wurden keine offenen Rechnungen, fehlenden Dokumente,
                            offenen Kennzeichen-Vorgänge oder unvollständigen Verkaufsakten erkannt.
                        </p>
                    </CardContent>
                </Card>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-2">
                <CheckListCard
                    title="Offene Rechnungen"
                    description="Rechnungen, die noch nicht als bezahlt markiert wurden."
                    emptyText="Keine offenen Rechnungen."
                    href="/dashboard/invoices"
                >
                    {data.openInvoices.map((invoice) => (
                        <Link
                            key={invoice.id}
                            href={`/dashboard/sales/${invoice.sale_id}`}
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-extrabold text-cyan-700">
                                        {invoice.invoice_number}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-950">
                                        {invoice.customer_name}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {invoice.vehicle_name} · {formatDate(invoice.invoice_date)}
                                    </p>
                                </div>

                                <StatusBadge
                                    tone={getInvoicePaymentStatusTone(
                                        invoice.payment_status as never,
                                    )}
                                >
                                    {getInvoicePaymentStatusLabel(
                                        invoice.payment_status as never,
                                    )}
                                </StatusBadge>
                            </div>

                            <p className="mt-3 text-right font-extrabold text-slate-950">
                                {formatCurrency(invoice.gross_amount)}
                            </p>
                        </Link>
                    ))}
                </CheckListCard>

                <CheckListCard
                    title="Dokumente mit Handlungsbedarf"
                    description="Dokumente, die fehlen oder geprüft werden müssen."
                    emptyText="Keine Dokumente mit Handlungsbedarf."
                    href="/dashboard/documents"
                >
                    {data.documentsToCheck.map((document) => (
                        <Link
                            key={document.id}
                            href="/dashboard/documents"
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-extrabold text-slate-950">
                                        {document.file_name}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-700">
                                        {getDocumentTypeLabel(document.document_type)}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {[document.customer_name, document.vehicle_name, document.invoice_number]
                                            .filter(Boolean)
                                            .join(" · ") || "Kein Bezug"}
                                    </p>
                                </div>

                                <StatusBadge
                                    tone={getDocumentStatusTone(document.status as never)}
                                >
                                    {getDocumentStatusLabel(document.status as never)}
                                </StatusBadge>
                            </div>

                            <p className="mt-3 text-xs font-semibold text-slate-500">
                                Angelegt: {formatDate(document.created_at)}
                            </p>
                        </Link>
                    ))}
                </CheckListCard>

                <CheckListCard
                    title="Offene Kennzeichen-Vorgänge"
                    description="Kurzzeit-, Export- oder Zollkennzeichen, die noch offen sind."
                    emptyText="Keine offenen Kennzeichen-Vorgänge."
                    href="/dashboard/plates"
                >
                    {data.openLicensePlateCases.map((plateCase) => (
                        <Link
                            key={plateCase.id}
                            href={`/dashboard/plates/${plateCase.id}`}
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-extrabold text-cyan-700">
                                        {plateCase.license_plate_number ?? "Kennzeichen offen"}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-950">
                                        {getLicensePlateTypeLabel(plateCase.plate_type as never)}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {[plateCase.vehicle_name, plateCase.customer_name]
                                            .filter(Boolean)
                                            .join(" · ") || "Kein Bezug"}
                                    </p>
                                </div>

                                <StatusBadge
                                    tone={getLicensePlateStatusTone(plateCase.status as never)}
                                >
                                    {getLicensePlateStatusLabel(plateCase.status as never)}
                                </StatusBadge>
                            </div>

                            <p className="mt-3 text-xs font-semibold text-slate-500">
                                Gültig bis: {formatDate(plateCase.valid_until)}
                            </p>
                        </Link>
                    ))}
                </CheckListCard>

                <CheckListCard
                    title="Ankaufsakten prüfen"
                    description="Ankäufe mit offener Zahlung oder fehlenden Pflichtdokumenten."
                    emptyText="Keine Ankaufsakten mit offener Prüfung."
                    href="/dashboard/ankauf"
                >
                    {data.purchaseCasesToCheck.map((purchase) => (
                        <Link
                            key={purchase.id}
                            href={`/dashboard/ankauf/${purchase.id}`}
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-extrabold text-cyan-700">
                                        {purchase.purchase_number ?? "Ankauf ohne Nummer"}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-950">
                                        {purchase.seller_name ?? "Kein Verkäufer"}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {[purchase.vehicle_name, formatDate(purchase.purchase_date)]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <StatusBadge
                                        tone={getPurchasePaymentStatusTone(
                                            purchase.payment_status as never,
                                        )}
                                    >
                                        {getPurchasePaymentStatusLabel(
                                            purchase.payment_status as never,
                                        )}
                                    </StatusBadge>

                                    <StatusBadge
                                        tone={getPurchaseDocumentStatusTone(
                                            purchase.document_check_status as never,
                                        )}
                                    >
                                        {getPurchaseDocumentStatusLabel(
                                            purchase.document_check_status as never,
                                        )}
                                    </StatusBadge>
                                </div>
                            </div>
                        </Link>
                    ))}
                </CheckListCard>

                <CheckListCard
                    title="Verkaufsakten prüfen"
                    description="Verkäufe mit offener Dokumentenprüfung."
                    emptyText="Keine Verkaufsakten mit offener Prüfung."
                    href="/dashboard/sales"
                >
                    {data.salesToCheck.map((sale) => (
                        <Link
                            key={sale.id}
                            href={`/dashboard/sales/${sale.id}`}
                            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-extrabold text-cyan-700">
                                        {sale.invoice_number ?? "Keine Rechnung"}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-slate-950">
                                        {sale.customer_name}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {sale.vehicle_name} · {formatDate(sale.sale_date)}
                                    </p>
                                </div>

                                <StatusBadge tone="warning">
                                    Prüfung offen
                                </StatusBadge>
                            </div>
                        </Link>
                    ))}
                </CheckListCard>
            </section>
        </div>
    );
}

function CheckStatCard({
                           label,
                           value,
                           description,
                           icon: Icon,
                           href,
                           danger = false,
                       }: {
    label: string;
    value: string | number;
    description: string;
    icon: typeof ClipboardCheck;
    href?: string;
    danger?: boolean;
}) {
    const card = (
        <Card className="group h-full rounded-[1.5rem] border-slate-200 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-500">{label}</p>
                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                            {value}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                            {description}
                        </p>
                    </div>

                    <div
                        className={
                            danger
                                ? "flex size-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-700"
                                : "flex size-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700"
                        }
                    >
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (!href) return card;

    return <Link href={href}>{card}</Link>;
}

function CheckListCard({
                           title,
                           description,
                           emptyText,
                           href,
                           children,
                       }: {
    title: string;
    description: string;
    emptyText: string;
    href: string;
    children: React.ReactNode;
}) {
    const hasChildren = Array.isArray(children)
        ? children.length > 0
        : Boolean(children);

    return (
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-950">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            {description}
                        </p>
                    </div>

                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold"
                    >
                        <Link href={href}>
                            Alle
                            <ArrowUpRight className="ml-1 size-3.5" />
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-3 p-4">
                    {hasChildren ? (
                        children
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                            <p className="text-sm font-bold text-slate-500">
                                {emptyText}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}