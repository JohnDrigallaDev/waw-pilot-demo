import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    ExternalLink,
    FileText,
    FileWarning,
    Receipt,
    RefreshCcw,
    Truck,
    UserRound,
    Wallet,
} from "lucide-react";
import { SaleDocumentUploadForm } from "@/components/sales/sale-document-upload-form";
import type {
    SaleDetail as SaleDetailType,
    SaleDetailInvoice,
} from "@/lib/sales/sale-detail-queries";
import { SaleInvoiceTypeActions } from "@/components/sales/sale-invoice-type-actions";
import { getInvoiceTypeLabel } from "@/lib/invoices/invoice-numbering";
import { SaleGeneratedDocumentsCard } from "@/components/sales/sale-generated-documents-card";
import type { SaleGeneratedDocumentCheck } from "@/lib/pdf/generated-documents/sale-document-checks";
import {
    getDatevStatusLabel,
    getDatevStatusTone,
    getPaymentStatusLabel,
    getPaymentStatusTone,
    getSaleStatusLabel,
    getSaleStatusTone,
    getSaleTypeLabel,
    getSaleTypeTone,
} from "@/lib/sales/sale-helpers";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { getDocumentTypeLabel } from "@/lib/documents/document-helpers";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    markInvoicePaidAction,
    regenerateSaleInvoicePdfAction,
} from "@/app/dashboard/sales/[saleId]/invoice-actions";
import { SaleExportDetailsForm } from "@/components/sales/sale-export-details-form";
import type { SaleExportDetails } from "@/lib/sales/sale-export-details-queries";

type SaleDetailProps = {
    sale: SaleDetailType;
    generatedDocuments: SaleGeneratedDocumentCheck[];
    exportDetails: SaleExportDetails;
    generatedDocumentType?: string | null;
};

export function SaleDetail({
                               sale,
                               generatedDocuments,
                               exportDetails,
                               generatedDocumentType = null,
                           }: SaleDetailProps) {
    const isDocumentComplete = sale.missing_required_documents_count === 0;
    const existingInvoiceTypes = sale.invoices.map(
        (invoice) => invoice.invoice_type,
    );

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Verkaufsakte"
                title={`Verkauf ${sale.invoice?.invoice_number ?? sale.vehicle.internal_number}`}
                description="Detailansicht mit Kunde, Fahrzeug, Rechnungen, Zahlung und Pflichtdokumenten."
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href="/dashboard/sales">
                            <ArrowLeft className="mr-2 size-4" />
                            Zurück
                        </Link>
                    </Button>
                }
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailStatCard
                    label="Verkaufstyp"
                    value={getSaleTypeLabel(sale.sale_type)}
                    description={formatDate(sale.sale_date)}
                    icon={Receipt}
                    tone={getSaleTypeTone(sale.sale_type)}
                />
                <DetailStatCard
                    label="Status"
                    value={getSaleStatusLabel(sale.status)}
                    description="Verkaufsstatus"
                    icon={CheckCircle2}
                    tone={getSaleStatusTone(sale.status)}
                />
                <DetailStatCard
                    label="Zahlung"
                    value={getPaymentStatusLabel(sale.payment_status)}
                    description={formatCurrency(sale.gross_amount)}
                    icon={Wallet}
                    tone={getPaymentStatusTone(sale.payment_status)}
                />
                <DetailStatCard
                    label="Pflichtdokumente"
                    value={`${sale.available_required_documents_count} von ${sale.required_documents_count}`}
                    description={
                        isDocumentComplete
                            ? "Verkaufsakte vollständig"
                            : `${sale.missing_required_documents_count} fehlen`
                    }
                    icon={FileWarning}
                    tone={isDocumentComplete ? "success" : "danger"}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                    <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                        <CardContent className="p-5">
                            <SectionTitle
                                icon={UserRound}
                                title="Kunde"
                                description="Käuferdaten aus der Verkaufsakte."
                            />

                            <div className="mt-5 space-y-3">
                                <InfoRow label="Name" value={sale.customer.name} />
                                <InfoRow
                                    label="Adresse"
                                    value={[
                                        sale.customer.street,
                                        [sale.customer.postal_code, sale.customer.city]
                                            .filter(Boolean)
                                            .join(" "),
                                        sale.customer.country,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                />
                                <InfoRow label="E-Mail" value={sale.customer.email ?? "—"} />
                                <InfoRow label="Telefon" value={sale.customer.phone ?? "—"} />
                                <InfoRow label="USt-ID" value={sale.customer.vat_id ?? "—"} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                        <CardContent className="p-5">
                            <SectionTitle
                                icon={Truck}
                                title="Fahrzeug"
                                description="Fahrzeugdaten und Rohgewinn."
                            />

                            <div className="mt-5 space-y-3">
                                <InfoRow label="Interne Nummer" value={sale.vehicle.internal_number} />
                                <InfoRow label="Fahrzeug" value={sale.vehicle.name} />
                                <InfoRow label="Fahrzeugtyp" value={sale.vehicle.vehicle_type} />
                                <InfoRow label="VIN" value={sale.vehicle.vin} />
                                <InfoRow
                                    label="Kennzeichen"
                                    value={sale.vehicle.license_plate ?? "—"}
                                />
                                <InfoRow
                                    label="Erstzulassung"
                                    value={formatDate(sale.vehicle.first_registration)}
                                />
                                <InfoRow
                                    label="Einkauf netto"
                                    value={formatCurrency(sale.vehicle.purchase_price_net)}
                                />
                                <InfoRow
                                    label="Nebenkosten netto"
                                    value={formatCurrency(sale.vehicle.additional_costs_net)}
                                />
                                <InfoRow
                                    label="Rohgewinn netto"
                                    value={formatCurrency(sale.profit_net)}
                                    strong
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                        <CardContent className="p-5">
                            <SectionTitle
                                icon={Receipt}
                                title="Rechnungen & Zahlung"
                                description="Normale Rechnung, Proforma-Rechnung, Anzahlungsrechnung und PDF."
                            />

                            <SaleInvoiceTypeActions
                                saleId={sale.id}
                                existingInvoiceTypes={existingInvoiceTypes}
                            />

                            {sale.invoices.length > 0 ? (
                                <div className="mt-5 space-y-4">
                                    {sale.invoices.map((invoice) => (
                                        <InvoiceCard
                                            key={invoice.id}
                                            saleId={sale.id}
                                            invoice={invoice}
                                            datevStatus={sale.datev_status}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-5">
                                    <EmptyBox text="Für diesen Verkauf wurde noch keine Rechnung erzeugt." />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <SaleExportDetailsForm details={exportDetails} />

                    <SaleGeneratedDocumentsCard
                        saleId={sale.id}
                        documents={generatedDocuments}
                        generatedDocumentType={generatedDocumentType}
                    />

                    <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                        <CardContent className="p-0">
                            <div className="border-b border-slate-200 p-5">
                                <SectionTitle
                                    icon={FileWarning}
                                    title="Pflichtdokumente"
                                    description="Fehlende Unterlagen direkt hochladen und automatisch der Verkaufsakte zuordnen."
                                />
                            </div>

                            <div className="divide-y divide-slate-100">
                                {sale.required_documents.map((requiredDocument) => (
                                    <div
                                        key={requiredDocument.documentType}
                                        className="p-5"
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {requiredDocument.isAvailable ? (
                                                        <CheckCircle2 className="size-5 text-emerald-700" />
                                                    ) : (
                                                        <FileWarning className="size-5 text-amber-700" />
                                                    )}

                                                    <p className="font-extrabold text-slate-950">
                                                        {requiredDocument.label}
                                                    </p>
                                                </div>

                                                <p className="mt-1 text-sm font-medium text-slate-500">
                                                    Typ: {getDocumentTypeLabel(requiredDocument.documentType)}
                                                </p>

                                                {requiredDocument.document ? (
                                                    <div className="mt-2 space-y-2">
                                                        <p className="text-sm font-semibold text-slate-600">
                                                            {requiredDocument.document.file_name}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl font-bold"
                                                            >
                                                                <Link
                                                                    href={`/api/documents/${requiredDocument.document.id}/file`}
                                                                    target="_blank"
                                                                >
                                                                    Öffnen
                                                                </Link>
                                                            </Button>

                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-xl font-bold"
                                                            >
                                                                <Link
                                                                    href={`/api/documents/${requiredDocument.document.id}/file?download=1`}
                                                                >
                                                                    <Download className="mr-1 size-3.5" />
                                                                    Download
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <StatusBadge
                                                tone={requiredDocument.isAvailable ? "success" : "danger"}
                                            >
                                                {requiredDocument.isAvailable ? "Vorhanden" : "Fehlt"}
                                            </StatusBadge>
                                        </div>

                                        <SaleDocumentUploadForm
                                            saleId={sale.id}
                                            documentType={requiredDocument.documentType}
                                            documentLabel={requiredDocument.label}
                                            existingDocumentId={requiredDocument.document?.id ?? null}
                                            existingFileName={requiredDocument.document?.file_name ?? null}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                        <CardContent className="p-0">
                            <div className="border-b border-slate-200 p-5">
                                <SectionTitle
                                    icon={FileText}
                                    title="Alle Dokumente"
                                    description="Alle Dokumente, die mit diesem Verkauf verknüpft sind."
                                />
                            </div>

                            {sale.documents.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {sale.documents.map((document) => (
                                        <div
                                            key={document.id}
                                            className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div>
                                                <p className="font-extrabold text-slate-950">
                                                    {document.file_name}
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-500">
                                                    {getDocumentTypeLabel(document.document_type)} · {document.status}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    tone={document.status === "available" ? "success" : "warning"}
                                                >
                                                    {document.status === "available" ? "Verfügbar" : "Prüfen"}
                                                </StatusBadge>

                                                {document.file_path ? (
                                                    <>
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-xl font-bold"
                                                        >
                                                            <Link href={`/api/documents/${document.id}/file`} target="_blank">
                                                                Öffnen
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                            className="rounded-xl font-bold"
                                                        >
                                                            <Link href={`/api/documents/${document.id}/file?download=1`}>
                                                                <Download className="mr-1 size-3.5" />
                                                                Download
                                                            </Link>
                                                        </Button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-5">
                                    <EmptyBox text="Noch keine Dokumente vorhanden." />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}

function InvoiceCard({
                         saleId,
                         invoice,
                         datevStatus,
                     }: {
    saleId: string;
    invoice: SaleDetailInvoice;
    datevStatus: SaleDetailType["datev_status"];
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                        {getInvoiceTypeLabel(invoice.invoice_type)}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-cyan-700">
                        {invoice.invoice_number}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatDate(invoice.invoice_date)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={getPaymentStatusTone(invoice.payment_status)}>
                        {getPaymentStatusLabel(invoice.payment_status)}
                    </StatusBadge>

                    <StatusBadge tone={getDatevStatusTone(datevStatus)}>
                        {`DATEV: ${getDatevStatusLabel(datevStatus)}`}
                    </StatusBadge>
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                <MiniAmount label="Netto" value={formatCurrency(invoice.net_amount)} />
                <MiniAmount label="MwSt." value={formatCurrency(invoice.vat_amount)} />
                <MiniAmount
                    label="Brutto"
                    value={formatCurrency(invoice.gross_amount)}
                />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <MarkSaleInvoicePaidButton saleId={saleId} invoice={invoice} />

                <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl bg-white font-bold"
                >
                    <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                        <ExternalLink className="mr-2 size-4" />
                        PDF öffnen
                    </Link>
                </Button>

                <Button
                    asChild
                    className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800"
                >
                    <Link href={`/api/invoices/${invoice.id}/pdf?download=1`}>
                        <Download className="mr-2 size-4" />
                        Herunterladen
                    </Link>
                </Button>

                <form action={regenerateSaleInvoicePdfAction}>
                    <input type="hidden" name="sale_id" value={saleId} />
                    <input type="hidden" name="invoice_id" value={invoice.id} />

                    <Button
                        type="submit"
                        variant="outline"
                        className="rounded-2xl bg-white font-bold"
                    >
                        <RefreshCcw className="mr-2 size-4" />
                        PDF neu generieren
                    </Button>
                </form>
            </div>
        </div>
    );
}

function MarkSaleInvoicePaidButton({
                                       saleId,
                                       invoice,
                                   }: {
    saleId: string;
    invoice: SaleDetailInvoice;
}) {
    if (invoice.invoice_type === "proforma") {
        return null;
    }

    if (invoice.payment_status === "paid") {
        return (
            <Button
                disabled
                variant="outline"
                className="rounded-2xl border-emerald-200 bg-emerald-50 font-bold text-emerald-700 disabled:cursor-default disabled:opacity-100"
            >
                <CheckCircle2 className="mr-2 size-4" />
                Bezahlt
            </Button>
        );
    }

    return (
        <form
            action={markInvoicePaidAction}
            className="flex flex-wrap items-center gap-2"
        >
            <input type="hidden" name="sale_id" value={saleId} />
            <input type="hidden" name="invoice_id" value={invoice.id} />

            <select
                name="payment_method"
                defaultValue="bank"
                className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
                <option value="bank">Bank</option>
                <option value="cash">Bar</option>
            </select>

            <Button
                type="submit"
                className="rounded-2xl bg-emerald-700 font-bold text-white hover:bg-emerald-800"
            >
                <CheckCircle2 className="mr-2 size-4" />
                {invoice.invoice_type === "down_payment"
                    ? "Anzahlung bezahlt"
                    : "Als bezahlt markieren"}
            </Button>
        </form>
    );
}

function SectionTitle({
                          icon: Icon,
                          title,
                          description,
                      }: {
    icon: typeof Receipt;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                <Icon className="size-5" />
            </div>
            <div>
                <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function InfoRow({
                     label,
                     value,
                     strong = false,
                 }: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p
                className={
                    strong
                        ? "text-right text-sm font-extrabold text-emerald-700"
                        : "text-right text-sm font-extrabold text-slate-950"
                }
            >
                {value || "—"}
            </p>
        </div>
    );
}

function MiniAmount({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 font-extrabold text-slate-950">{value}</p>
        </div>
    );
}

function DetailStatCard({
                            label,
                            value,
                            description,
                            icon: Icon,
                            tone,
                        }: {
    label: string;
    value: string;
    description: string;
    icon: typeof Receipt;
    tone: "success" | "warning" | "danger" | "info" | "neutral";
}) {
    const toneClasses = {
        success: "border-emerald-100 bg-emerald-50 text-emerald-700",
        warning: "border-amber-100 bg-amber-50 text-amber-700",
        danger: "border-red-100 bg-red-50 text-red-700",
        info: "border-cyan-100 bg-cyan-50 text-cyan-700",
        neutral: "border-slate-200 bg-slate-50 text-slate-700",
    };

    return (
        <Card className="rounded-[1.5rem] border-slate-200 bg-white/90 shadow-sm">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-500">{label}</p>
                        <p className="mt-3 text-xl font-extrabold tracking-tight text-slate-950">
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

function EmptyBox({ text }: { text: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">{text}</p>
        </div>
    );
}