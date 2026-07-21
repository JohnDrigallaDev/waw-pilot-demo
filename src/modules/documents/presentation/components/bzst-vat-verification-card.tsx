import { ExternalLink, ShieldCheck } from "lucide-react";

import { SaleDocumentUploadForm } from "@/components/sales/sale-document-upload-form";
import { DocumentCard } from "@/components/shared/document-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { BZST_VAT_VALIDATION_URL } from "@/src/modules/documents/domain/constants/external-document-links";

type BzstDocument = {
    id: string;
    document_type: string;
    file_name: string;
    status: string;
};

type BzstVatVerificationCardProps = {
    saleId: string;
    vatId: string | null;
    documents: BzstDocument[];
};

const slots = [
    {
        documentType: "bzst_vat_verification_primary",
        label: "BZSt-Prüfnachweis – Ergebnisübersicht",
    },
    {
        documentType: "bzst_vat_verification_secondary",
        label: "BZSt-Prüfnachweis – qualifizierte Bestätigung",
    },
] as const;

export function BzstVatVerificationCard({
                                            saleId,
                                            vatId,
                                            documents,
                                        }: BzstVatVerificationCardProps) {
    const existingByType = new Map(
        documents
            .filter((document) => document.status === "available")
            .map((document) => [document.document_type, document]),
    );
    const availableCount = slots.filter((slot) =>
        existingByType.has(slot.documentType),
    ).length;

    return (
        <div className="mt-4 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4">
            <DocumentCard
                className="border-0 bg-transparent p-0 shadow-none"
                icon={<ShieldCheck className="size-5 text-cyan-700" />}
                title="USt-ID beim Bundeszentralamt für Steuern prüfen"
                description="Manuelle Prüfung auf der offiziellen BZSt-Seite. Es werden keine Daten automatisch übertragen."
                status={
                    <div className="mt-2 flex flex-wrap gap-2">
                        <StatusBadge tone={availableCount === 2 ? "success" : "warning"}>
                            {availableCount} von 2 Nachweisen vorhanden
                        </StatusBadge>
                        {vatId ? (
                            <StatusBadge tone="neutral">USt-ID: {vatId}</StatusBadge>
                        ) : null}
                    </div>
                }
            />

            <div className="mt-4">
                <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl border-cyan-200 bg-white font-bold text-cyan-800 hover:bg-cyan-100"
                >
                    <a
                        href={BZST_VAT_VALIDATION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="mr-2 size-4" />
                        Offizielle BZSt-Prüfseite öffnen
                    </a>
                </Button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {slots.map((slot) => {
                    const existingDocument = existingByType.get(slot.documentType);

                    return (
                        <SaleDocumentUploadForm
                            key={slot.documentType}
                            saleId={saleId}
                            documentType={slot.documentType}
                            documentLabel={slot.label}
                            existingDocumentId={existingDocument?.id ?? null}
                            existingFileName={existingDocument?.file_name ?? null}
                        />
                    );
                })}
            </div>
        </div>
    );
}
