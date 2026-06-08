"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    Archive,
    Download,
    ExternalLink,
    FileArchive,
    FileText,
    FileWarning,
    Receipt,
    Search,
    Upload,
} from "lucide-react";

import type { DocumentRow } from "@/lib/documents/document-queries";
import {
    getDocumentSourceLabel,
    getDocumentStatusLabel,
    getDocumentStatusTone,
    getDocumentTypeLabel,
} from "@/lib/documents/document-helpers";
import { formatDate } from "@/lib/format/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DocumentsOverviewProps = {
    documents: DocumentRow[];
};

type DocumentFilter =
    | "all"
    | "invoices"
    | "vehicle_documents"
    | "purchase_documents"
    | "license_plates"
    | "cashbook"
    | "needs_review";

const invoiceDocumentTypes = [
    "invoice",
    "invoice_pdf",
    "proforma_invoice",
    "down_payment_invoice",
];

const purchaseDocumentTypes = [
    "purchase_invoice",
    "purchase_contract",
    "purchase_receipt",
    "purchase_payment_proof",
    "seller_id",
    "seller_commercial_register",
];

const licensePlateDocumentTypes = [
    "license_plate_document",
    "license_plate_insurance",
    "license_plate_power_of_attorney",
    "license_plate_registration",
];

const vehicleDocumentTypes = [
    "vehicle_registration",
    "contract",
    "handover_protocol",
    "entry_certificate",
    "transport_proof",
    "abd_checklist",
    "exit_note_checklist",
    "customs",
    "commercial_register",
    "owner_id",
    "customer_id",
    "export_documents",
    "registration_documents",
    "insurance_document",
    "tax_document",
];

export function DocumentsOverview({ documents }: DocumentsOverviewProps) {
    const [query, setQuery] = useState("");
    const [documentFilter, setDocumentFilter] =
        useState<DocumentFilter>("all");

    const availableDocuments = documents.filter(
        (document) => document.status === "available",
    ).length;

    const needsReviewDocuments = documents.filter(
        (document) =>
            document.status === "needs_review" || document.status === "missing",
    ).length;

    const generatedDocuments = documents.filter(
        (document) => document.generated_by_system,
    ).length;

    const uploadedDocuments = documents.filter(
        (document) => !document.generated_by_system,
    ).length;

    const invoiceDocuments = documents.filter((document) =>
        invoiceDocumentTypes.includes(document.document_type),
    ).length;

    const vehicleDocuments = documents.filter((document) =>
        vehicleDocumentTypes.includes(document.document_type),
    ).length;

    const purchaseDocuments = documents.filter((document) =>
        purchaseDocumentTypes.includes(document.document_type),
    ).length;

    const licensePlateDocuments = documents.filter((document) =>
        licensePlateDocumentTypes.includes(document.document_type),
    ).length;

    const cashbookDocuments = documents.filter(
        (document) => document.document_type === "cashbook_receipt",
    ).length;

    const filteredDocuments = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return documents.filter((document) => {
            const matchesFilter =
                documentFilter === "all" ||
                (documentFilter === "invoices" &&
                    invoiceDocumentTypes.includes(document.document_type)) ||
                (documentFilter === "vehicle_documents" &&
                    vehicleDocumentTypes.includes(document.document_type)) ||
                (documentFilter === "purchase_documents" &&
                    purchaseDocumentTypes.includes(document.document_type)) ||
                (documentFilter === "license_plates" &&
                    licensePlateDocumentTypes.includes(document.document_type)) ||
                (documentFilter === "cashbook" &&
                    document.document_type === "cashbook_receipt") ||
                (documentFilter === "needs_review" &&
                    (document.status === "needs_review" ||
                        document.status === "missing"));

            if (!matchesFilter) return false;

            if (!normalizedQuery) return true;

            const searchableText = [
                document.file_name,
                document.document_type,
                getDocumentTypeLabel(document.document_type),
                getDocumentSourceLabel(document.source),
                getDocumentStatusLabel(document.status),
                document.customer_name,
                document.vehicle_internal_number,
                document.vehicle_name,
                document.invoice_number,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedQuery);
        });
    }, [query, documents, documentFilter]);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Dokumentenarchiv"
                title="Dokumente"
                description="Alle Rechnungen, Verkaufsunterlagen, Fahrzeugdokumente und Kassenbuch-Belege zentral prüfen, öffnen und herunterladen."
                action={
                    <Button
                        disabled
                        className="rounded-2xl bg-cyan-700 font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Upload className="mr-2 size-4" />
                        Upload später
                    </Button>
                }
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DocumentStatCard
                    label="Dokumente gesamt"
                    value={documents.length}
                    description="Archivierte Dateien"
                    icon={FileArchive}
                />
                <DocumentStatCard
                    label="Verfügbar"
                    value={availableDocuments}
                    description="direkt abrufbar"
                    icon={FileText}
                />
                <DocumentStatCard
                    label="Zu prüfen / fehlend"
                    value={needsReviewDocuments}
                    description="Dokumente mit Handlungsbedarf"
                    icon={FileWarning}
                    danger={needsReviewDocuments > 0}
                />
                <DocumentStatCard
                    label="Automatisch"
                    value={generatedDocuments}
                    description={`${uploadedDocuments} hochgeladen`}
                    icon={Archive}
                />
            </section>

            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                <CardContent className="p-0">
                    <div className="border-b border-slate-200 bg-white p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-950">
                                    Dokumentenliste
                                </h2>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Suche nach Datei, Dokumenttyp, Kunde, Fahrzeug oder Rechnung.
                                </p>
                            </div>

                            <div className="relative w-full xl:max-w-sm">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Dokument suchen..."
                                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-medium"
                                />
                            </div>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <div className="inline-grid min-w-max grid-cols-7 gap-1 rounded-2xl bg-slate-100 p-1">
                                <DocumentFilterButton
                                    active={documentFilter === "all"}
                                    onClick={() => setDocumentFilter("all")}
                                    label="Alle"
                                    count={documents.length}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "invoices"}
                                    onClick={() => setDocumentFilter("invoices")}
                                    label="Rechnungen"
                                    count={invoiceDocuments}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "vehicle_documents"}
                                    onClick={() => setDocumentFilter("vehicle_documents")}
                                    label="Fahrzeuge"
                                    count={vehicleDocuments}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "purchase_documents"}
                                    onClick={() => setDocumentFilter("purchase_documents")}
                                    label="Ankauf"
                                    count={purchaseDocuments}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "license_plates"}
                                    onClick={() => setDocumentFilter("license_plates")}
                                    label="Kennzeichen"
                                    count={licensePlateDocuments}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "cashbook"}
                                    onClick={() => setDocumentFilter("cashbook")}
                                    label="Kassenbuch"
                                    count={cashbookDocuments}
                                />
                                <DocumentFilterButton
                                    active={documentFilter === "needs_review"}
                                    onClick={() => setDocumentFilter("needs_review")}
                                    label="Prüfen"
                                    count={needsReviewDocuments}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="grid gap-4 p-4 md:hidden">
                            {filteredDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.99]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <DocumentTypePill document={document} />

                                            <p className="mt-2 break-all text-base font-extrabold text-slate-950">
                                                {document.file_name}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                                {document.mime_type ?? "Unbekannter Dateityp"}
                                            </p>
                                        </div>

                                        <StatusBadge tone={getDocumentStatusTone(document.status)}>
                                            {getDocumentStatusLabel(document.status)}
                                        </StatusBadge>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <DocumentMobileInfoBox
                                            label="Quelle"
                                            value={getDocumentSourceLabel(document.source)}
                                        />
                                        <DocumentMobileInfoBox
                                            label="Datum"
                                            value={formatDate(document.created_at)}
                                        />
                                        <DocumentMobileInfoBox
                                            label="Kunde"
                                            value={document.customer_name ?? "—"}
                                        />
                                        <DocumentMobileInfoBox
                                            label="Fahrzeug"
                                            value={
                                                document.vehicle_internal_number
                                                    ? `${document.vehicle_internal_number} · ${
                                                        document.vehicle_name ?? ""
                                                    }`
                                                    : "—"
                                            }
                                        />
                                    </div>

                                    {document.invoice_number ? (
                                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Rechnung
                                            </p>
                                            <p className="mt-1 text-sm font-extrabold text-cyan-700">
                                                {document.invoice_number}
                                            </p>
                                        </div>
                                    ) : null}

                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <DocumentOpenButton document={document} fullWidth />
                                        <DocumentDownloadButton document={document} fullWidth />
                                    </div>
                                </div>
                            ))}

                            {filteredDocuments.length === 0 ? <EmptyDocumentsState /> : null}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[1120px] text-left">
                                <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Dokument</th>
                                    <th className="px-5 py-4">Typ</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Quelle</th>
                                    <th className="px-5 py-4">Bezug</th>
                                    <th className="px-5 py-4">Datum</th>
                                    <th className="px-5 py-4 text-right">Aktionen</th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                {filteredDocuments.map((document) => (
                                    <tr
                                        key={document.id}
                                        className="group bg-white transition-colors hover:bg-cyan-50/30"
                                    >
                                        <td className="px-5 py-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                                                    <FileText className="size-5" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="max-w-xs truncate font-extrabold text-slate-950">
                                                        {document.file_name}
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                                        {document.mime_type ?? "Unbekannter Dateityp"}
                                                    </p>
                                                    {document.file_size ? (
                                                        <p className="mt-1 text-xs font-semibold text-slate-400">
                                                            {formatFileSize(document.file_size)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-5">
                                            <DocumentTypePill document={document} />
                                        </td>

                                        <td className="px-5 py-5">
                                            <StatusBadge tone={getDocumentStatusTone(document.status)}>
                                                {getDocumentStatusLabel(document.status)}
                                            </StatusBadge>
                                        </td>

                                        <td className="px-5 py-5">
                                            <StatusBadge tone="neutral">
                                                {getDocumentSourceLabel(document.source)}
                                            </StatusBadge>
                                        </td>

                                        <td className="px-5 py-5">
                                            <div className="space-y-1">
                                                {document.customer_name ? (
                                                    <p className="text-sm font-bold text-slate-950">
                                                        {document.customer_name}
                                                    </p>
                                                ) : null}

                                                {document.vehicle_internal_number ? (
                                                    <p className="text-sm font-semibold text-slate-600">
                                                        {document.vehicle_internal_number}
                                                        {document.vehicle_name
                                                            ? ` · ${document.vehicle_name}`
                                                            : ""}
                                                    </p>
                                                ) : null}

                                                {document.invoice_number ? (
                                                    <p className="text-sm font-extrabold text-cyan-700">
                                                        Rechnung {document.invoice_number}
                                                    </p>
                                                ) : null}

                                                {!document.customer_name &&
                                                !document.vehicle_internal_number &&
                                                !document.invoice_number ? (
                                                    <p className="text-sm font-semibold text-slate-400">
                                                        —
                                                    </p>
                                                ) : null}
                                            </div>
                                        </td>

                                        <td className="px-5 py-5">
                                            <p className="text-sm font-semibold text-slate-700">
                                                {formatDate(document.created_at)}
                                            </p>
                                        </td>

                                        <td className="px-5 py-5">
                                            <div className="flex justify-end gap-2">
                                                <DocumentOpenButton document={document} />
                                                <DocumentDownloadButton document={document} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {filteredDocuments.length === 0 ? <EmptyDocumentsState /> : null}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DocumentFilterButton({
                                  active,
                                  onClick,
                                  label,
                                  count,
                              }: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                active
                    ? "flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-950 shadow-sm"
                    : "flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-slate-500 transition hover:text-slate-950"
            }
        >
            <span>{label}</span>
            <span
                className={
                    active
                        ? "rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-extrabold text-cyan-700"
                        : "rounded-full bg-white/70 px-2 py-0.5 text-xs font-extrabold text-slate-400"
                }
            >
                {count}
            </span>
        </button>
    );
}

function DocumentTypePill({ document }: { document: DocumentRow }) {
    const group = getDocumentGroup(document.document_type);

    const classes = {
        invoice: "border-cyan-100 bg-cyan-50 text-cyan-700",
        vehicle: "border-violet-100 bg-violet-50 text-violet-700",
        purchase: "border-orange-100 bg-orange-50 text-orange-700",
        license_plate: "border-blue-100 bg-blue-50 text-blue-700",
        cashbook: "border-emerald-100 bg-emerald-50 text-emerald-700",
        review: "border-amber-100 bg-amber-50 text-amber-700",
        other: "border-slate-200 bg-slate-50 text-slate-700",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${classes[group]}`}
        >
            {getDocumentTypeLabel(document.document_type)}
        </span>
    );
}

function getDocumentGroup(
    documentType: string,
): "invoice" | "vehicle" | "purchase" | "license_plate" | "cashbook" | "review" | "other" {
    if (invoiceDocumentTypes.includes(documentType)) return "invoice";
    if (vehicleDocumentTypes.includes(documentType)) return "vehicle";
    if (purchaseDocumentTypes.includes(documentType)) return "purchase";
    if (licensePlateDocumentTypes.includes(documentType)) return "license_plate";
    if (documentType === "cashbook_receipt") return "cashbook";

    return "other";
}

type DocumentActionProps = {
    document: DocumentRow;
    fullWidth?: boolean;
};

function DocumentOpenButton({ document, fullWidth = false }: DocumentActionProps) {
    const hasFile = Boolean(document.file_path);

    return (
        <Button
            asChild={hasFile}
            disabled={!hasFile}
            variant="outline"
            size="sm"
            className={
                fullWidth
                    ? "h-11 w-full rounded-2xl font-bold"
                    : "rounded-xl font-bold"
            }
        >
            {hasFile ? (
                <Link href={`/api/documents/${document.id}/file`} target="_blank">
                    <ExternalLink className="mr-1 size-3.5" />
                    Öffnen
                </Link>
            ) : (
                <span>
                    <ExternalLink className="mr-1 size-3.5" />
                    Öffnen
                </span>
            )}
        </Button>
    );
}

function DocumentDownloadButton({
                                    document,
                                    fullWidth = false,
                                }: DocumentActionProps) {
    const hasFile = Boolean(document.file_path);

    return (
        <Button
            asChild={hasFile}
            disabled={!hasFile}
            variant="outline"
            size="sm"
            className={
                fullWidth
                    ? "h-11 w-full rounded-2xl font-bold"
                    : "rounded-xl font-bold"
            }
        >
            {hasFile ? (
                <Link href={`/api/documents/${document.id}/file?download=1`}>
                    <Download className="mr-1 size-3.5" />
                    Download
                </Link>
            ) : (
                <span>
                    <Download className="mr-1 size-3.5" />
                    Download
                </span>
            )}
        </Button>
    );
}

function DocumentStatCard({
                              label,
                              value,
                              description,
                              icon: Icon,
                              danger = false,
                          }: {
    label: string;
    value: string | number;
    description: string;
    icon: typeof FileArchive;
    danger?: boolean;
}) {
    return (
        <Card className="group rounded-[1.5rem] border-slate-200 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
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
                                ? "flex size-11 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700"
                                : "flex size-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700"
                        }
                    >
                        <Icon className="size-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function DocumentMobileInfoBox({
                                   label,
                                   value,
                               }: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-extrabold text-slate-950">
                {value}
            </p>
        </div>
    );
}

function EmptyDocumentsState() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <FileArchive className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-slate-950">
                Keine Dokumente gefunden
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                Passe deine Suche an oder lade neue Dokumente in einer Verkaufsakte hoch.
            </p>
        </div>
    );
}

function formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
    }

    if (sizeInBytes < 1024 * 1024) {
        return `${Math.round(sizeInBytes / 1024)} KB`;
    }

    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}