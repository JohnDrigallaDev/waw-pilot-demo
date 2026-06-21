import Link from "next/link";
import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    FileCheck2,
    FileSignature,
    FileText,
    Info,
    PencilLine,
    UserRoundCog,
} from "lucide-react";

import { generateSaleDocumentAction } from "@/app/dashboard/sales/[saleId]/generated-document-actions";
import { SaleDocumentUploadForm } from "@/components/sales/sale-document-upload-form";
import type { SaleGeneratedDocumentCheck } from "@/lib/pdf/generated-documents/sale-document-checks";
import type { GeneratedDocumentType } from "@/lib/pdf/generated-documents/document-types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateSaleDocumentSubmitButton } from "@/components/sales/generate-sale-document-submit-button";
import { TemporarySuccessMessage } from "@/components/shared/temporary-success-message";

type SaleGeneratedDocumentsCardProps = {
    saleId: string;
    documents: SaleGeneratedDocumentCheck[];
    generatedDocumentType?: string | null;
};

const supportedGeneratedDocumentTypes = new Set<GeneratedDocumentType>([
    "proforma_invoice",
    "handover_protocol",
    "entry_certificate",
    "transport_proof",
    "license_plate_consent",
    "travel_expense_form",
]);

export function SaleGeneratedDocumentsCard({
                                               saleId,
                                               documents,
                                               generatedDocumentType = null,
                                           }: SaleGeneratedDocumentsCardProps) {
    const missingDataCount = documents.filter(
        (document) => document.status === "missing_data",
    ).length;

    const signedCount = documents.filter(
        (document) => document.status === "signed_received",
    ).length;

    const generatedCount = documents.filter(
        (document) =>
            document.status === "generated_available" ||
            document.status === "generated_needs_signature" ||
            document.status === "sent_to_customer" ||
            document.status === "signed_received",
    ).length;

    return (
        <Card
            id="automatic-documents"
            className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm"
        >
            <CardContent className="p-0">
                <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-start gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                                    <FileSignature className="size-5" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-xl font-extrabold text-slate-950">
                                        Automatische Dokumente
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                                        Prüfung der erzeugbaren Verkaufsdokumente inklusive Pflichtdaten,
                                        Unterschriftenstatus und vorhandenen Dateien.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[390px]">
                            <SummaryStat
                                label="Erzeugt"
                                value={generatedCount}
                                tone="info"
                            />
                            <SummaryStat
                                label="Unterschrieben"
                                value={signedCount}
                                tone="success"
                            />
                            <SummaryStat
                                label="Daten fehlen"
                                value={missingDataCount}
                                tone={missingDataCount > 0 ? "danger" : "success"}
                            />
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {documents.map((document) => (
                        <GeneratedDocumentRow
                            key={document.type}
                            saleId={saleId}
                            document={document}
                            wasJustGenerated={generatedDocumentType === document.type}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function GeneratedDocumentRow({
                                  saleId,
                                  document,
                                  wasJustGenerated,
                              }: {
    saleId: string;
    document: SaleGeneratedDocumentCheck;
    wasJustGenerated: boolean;
}) {
    const canOpenGenerated = Boolean(document.generatedDocument?.id);
    const isGenerationSupported = supportedGeneratedDocumentTypes.has(document.type);
    const canGenerateNow = document.canGenerate && isGenerationSupported;

    return (
        <div className="p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <DocumentIcon status={document.status} />

                        <h3 className="text-base font-extrabold text-slate-950">
                            {document.label}
                        </h3>

                        <StatusBadge tone={document.statusTone}>
                            {document.statusLabel}
                        </StatusBadge>

                        {document.requiresSignature ? (
                            <StatusBadge tone="warning">
                                Unterschrift nötig
                            </StatusBadge>
                        ) : (
                            <StatusBadge tone="neutral">
                                Keine Unterschrift
                            </StatusBadge>
                        )}

                        {!isGenerationSupported ? (
                            <StatusBadge tone="info">
                                {document.type === "invoice_pdf"
                                    ? "Über Rechnungsprozess"
                                    : "Generator folgt"}
                            </StatusBadge>
                        ) : null}
                    </div>

                    <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                        {document.description}
                    </p>

                    {wasJustGenerated ? (
                        <TemporarySuccessMessage
                            title="Dokument wurde erfolgreich erzeugt."
                            description="Die PDF wurde gespeichert und ist jetzt in der Verkaufsakte verfügbar."
                            durationMs={3000}
                        />
                    ) : null}

                    {document.missingFields.length > 0 ? (
                        <div className="mt-4 rounded-3xl border border-red-100 bg-red-50 p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-extrabold text-red-800">
                                        Dieses Dokument kann noch nicht erzeugt werden.
                                    </p>

                                    <ul className="mt-2 space-y-1">
                                        {document.missingFields.map((field) => (
                                            <li
                                                key={`${document.type}-${field.field}`}
                                                className="text-xs font-semibold text-red-700"
                                            >
                                                {field.message}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-red-200 bg-white font-extrabold text-red-700 hover:bg-red-100"
                                        >
                                            <Link href="#export-details">
                                                <PencilLine className="mr-2 size-3.5" />
                                                Exportdaten ergänzen
                                            </Link>
                                        </Button>

                                        {document.missingFields.some((field) =>
                                            field.field.startsWith("customer."),
                                        ) ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-700">
                                                    Kundendaten wie USt-ID bitte im Kundenstamm ergänzen.
                                                </div>

                                                {document.customerId ? (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl border-red-200 bg-white font-extrabold text-red-700 hover:bg-red-100"
                                                    >
                                                        <Link href={`/dashboard/customers/${document.customerId}`}>
                                                            <UserRoundCog className="mr-2 size-3.5" />
                                                            Kundendaten öffnen
                                                        </Link>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <DocumentFileStatus
                            title="Generiertes Dokument"
                            document={document.generatedDocument}
                            emptyText={
                                document.canGenerate
                                    ? isGenerationSupported
                                        ? "Noch nicht erzeugt."
                                        : "Generator für dieses Dokument wird als Nächstes umgesetzt."
                                    : "Erzeugung erst nach vollständigen Daten möglich."
                            }
                        />

                        {document.requiresSignature ? (
                            <DocumentFileStatus
                                title="Unterschriebenes Dokument"
                                document={document.signedDocument}
                                emptyText="Noch nicht unterschrieben hochgeladen."
                            />
                        ) : (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400">
                                        <Info className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-700">
                                            Unterschrift
                                        </p>
                                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                            Für dieses Dokument ist kein unterschriebener Rücklauf vorgesehen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {document.requiresSignature && document.generatedDocument ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-extrabold text-slate-950">
                                Unterschriebenes Dokument hochladen
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                                Lade hier die vom Kunden unterschriebene Version hoch. Danach gilt der Rücklauf als vorhanden.
                            </p>

                            <div className="mt-4">
                                <SaleDocumentUploadForm
                                    saleId={saleId}
                                    documentType={document.documentType}
                                    documentLabel={`${document.label} unterschrieben`}
                                    existingDocumentId={document.signedDocument?.id ?? null}
                                    existingFileName={document.signedDocument?.fileName ?? null}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2 xl:w-48">
                    <form action={generateSaleDocumentAction}>
                        <input type="hidden" name="sale_id" value={saleId} />
                        <input type="hidden" name="document_type" value={document.type} />

                        <GenerateSaleDocumentSubmitButton
                            disabled={!canGenerateNow}
                            isGenerated={Boolean(document.generatedDocument?.id)}
                        />
                    </form>

                    {canOpenGenerated ? (
                        <Button
                            asChild
                            variant="outline"
                            className="h-11 rounded-2xl border-slate-200 bg-white font-bold"
                        >
                            <Link
                                href={`/api/documents/${document.generatedDocument?.id}/file`}
                                target="_blank"
                            >
                                <ExternalLink className="mr-2 size-4" />
                                Öffnen
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function DocumentFileStatus({
                                title,
                                document,
                                emptyText,
                            }: {
    title: string;
    document: SaleGeneratedDocumentCheck["generatedDocument"];
    emptyText: string;
}) {
    if (!document) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400">
                        <FileText className="size-4" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-slate-700">
                            {title}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                            {emptyText}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                    <FileCheck2 className="size-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-emerald-900">
                        {title}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold leading-5 text-emerald-800">
                        {document.fileName}
                    </p>
                </div>
            </div>
        </div>
    );
}

function DocumentIcon({
                          status,
                      }: {
    status: SaleGeneratedDocumentCheck["status"];
}) {
    if (status === "missing_data") {
        return <AlertTriangle className="size-5 text-red-600" />;
    }

    if (status === "signed_received" || status === "generated_available") {
        return <CheckCircle2 className="size-5 text-emerald-700" />;
    }

    return <FileText className="size-5 text-cyan-700" />;
}

function SummaryStat({
                         label,
                         value,
                         tone,
                     }: {
    label: string;
    value: number;
    tone: "success" | "danger" | "info";
}) {
    const toneClasses = {
        success: {
            wrapper: "border-emerald-100 bg-emerald-50 text-emerald-900",
            value: "text-emerald-950",
            label: "text-emerald-700",
        },
        danger: {
            wrapper: "border-red-100 bg-red-50 text-red-900",
            value: "text-red-950",
            label: "text-red-700",
        },
        info: {
            wrapper: "border-cyan-100 bg-cyan-50 text-cyan-900",
            value: "text-cyan-950",
            label: "text-cyan-700",
        },
    };

    const classes = toneClasses[tone];

    return (
        <div
            className={`flex min-h-[78px] min-w-0 flex-col items-center justify-center rounded-[1.35rem] border px-3 py-3 text-center shadow-sm ${classes.wrapper}`}
        >
            <p className={`text-2xl font-black leading-none ${classes.value}`}>
                {value}
            </p>
            <p
                className={`mt-2 max-w-full break-words text-center text-[10px] font-extrabold uppercase leading-4 tracking-[0.08em] ${classes.label}`}
            >
                {label}
            </p>
        </div>
    );
}