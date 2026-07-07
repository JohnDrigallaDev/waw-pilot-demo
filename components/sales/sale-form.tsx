"use client";

import Link from "next/link";
import {
    useActionState,
    useState,
    type ChangeEventHandler,
    type FormEventHandler,
} from "react";
import {
    Building2,
    CalendarDays,
    Globe2,
    Info,
    Receipt,
    Save,
    Truck,
    UserRound,
} from "lucide-react";

import { createSaleAction } from "@/app/dashboard/sales/new/actions";
import type { CustomerRow } from "@/lib/customers/customer-queries";
import { getCustomerDisplayName } from "@/lib/customers/customer-helpers";
import type { VehicleRow } from "@/lib/vehicles/vehicle-queries";
import { getVehicleDisplayName } from "@/lib/vehicles/vehicle-helpers";
import { formatCurrency } from "@/lib/format/currency";
import { phoneInputPattern, sanitizePhoneInput } from "@/lib/validation/phone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
    success: false,
    message: "",
};

const monthOptions = [
    { value: "", label: "Bitte wählen" },
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "März" },
    { value: "04", label: "April" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
];

function getYearOptions() {
    const currentYear = new Date().getFullYear();

    return [
        "",
        String(currentYear - 1),
        String(currentYear),
        String(currentYear + 1),
    ];
}

type BuyerMode = "existing" | "new";
type NewCustomerType = "company" | "private";
type SaleType = "inland" | "eu" | "export_third_country";

type SaleFormProps = {
    customers: CustomerRow[];
    vehicles: VehicleRow[];
    defaultVehicleId?: string | null;
    defaultCustomerId?: string | null;
};

function getDefaultVatRateForSaleType(saleType: SaleType): string {
    return saleType === "inland" ? "19" : "0";
}

function parseDecimalInput(value: string): number | null {
    const normalizedValue = value.trim().replace(",", ".");
    const numberValue = Number(normalizedValue);

    return Number.isFinite(numberValue) ? numberValue : null;
}

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

function getTaxHint(saleType: SaleType): string {
    if (saleType === "eu") {
        return "EU-Verkauf: steuerfreie innergemeinschaftliche Lieferung möglich. Bitte USt-IdNr. und Nachweise prüfen.";
    }

    if (saleType === "export_third_country") {
        return "Drittlandexport: steuerfreie Ausfuhrlieferung möglich. Bitte Ausfuhrnachweise/Zollnachweise prüfen.";
    }

    return "Inlandsverkauf mit deutscher Umsatzsteuer.";
}

export function SaleForm({
                             customers,
                             vehicles,
                             defaultVehicleId = null,
                             defaultCustomerId = null,
                         }: SaleFormProps) {
    const [state, formAction, isPending] = useActionState(
        createSaleAction,
        initialState,
    );

    const [buyerMode, setBuyerMode] = useState<BuyerMode>(
        defaultCustomerId || customers.length > 0 ? "existing" : "new",
    );

    const [newCustomerType, setNewCustomerType] =
        useState<NewCustomerType>("company");

    const [saleType, setSaleType] = useState<SaleType>("inland");
    const [selectedCustomerId, setSelectedCustomerId] = useState(
        defaultCustomerId ?? "",
    );
    const [selectedVehicleId, setSelectedVehicleId] = useState(
        defaultVehicleId ?? "",
    );
    const [netAmount, setNetAmount] = useState("");
    const [vatRate, setVatRate] = useState("19");
    const requiresExportDetails =
        saleType === "eu" || saleType === "export_third_country";
    const selectedCustomer =
        customers.find((customer) => customer.id === selectedCustomerId) ?? null;
    const selectedVehicle =
        vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
    const selectedCustomerMissingTaxNumber =
        buyerMode === "existing" &&
        saleType === "inland" &&
        Boolean(selectedCustomer) &&
        !selectedCustomer?.tax_number;
    const selectedCustomerMissingVatId =
        buyerMode === "existing" &&
        saleType === "eu" &&
        Boolean(selectedCustomer) &&
        !selectedCustomer?.vat_id;
    const requiresNewCustomerTaxNumber = buyerMode === "new" && saleType === "inland";
    const requiresNewCustomerVatId = buyerMode === "new" && saleType === "eu";

    const today = new Date().toISOString().slice(0, 10);
    const previewNetAmount = parseDecimalInput(netAmount) ?? 0;
    const previewVatRate = parseDecimalInput(vatRate) ?? 0;
    const previewVatAmount = roundMoney(previewNetAmount * (previewVatRate / 100));
    const previewGrossAmount = roundMoney(previewNetAmount + previewVatAmount);

    function handleSaleTypeChange(nextSaleType: SaleType) {
        setSaleType(nextSaleType);
        setVatRate(getDefaultVatRateForSaleType(nextSaleType));
    }

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Neuer Verkauf"
                title="Verkauf anlegen"
                description="Fahrzeug verkaufen, Käufer zuordnen, Rechnung vorbereiten und Fahrzeugstatus automatisch aktualisieren."
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href="/dashboard/sales">Zurück</Link>
                    </Button>
                }
            />

            <form action={formAction} className="space-y-6">
                {state.message ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {state.message}
                    </div>
                ) : null}

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Truck}
                            title="Fahrzeug"
                            description="Wähle ein Fahrzeug aus dem aktuellen Bestand."
                        />

                        <div className="space-y-2">
                            <Label htmlFor="vehicle_id" className="font-bold text-slate-700">
                                Fahrzeug *
                            </Label>

                            <select
                                id="vehicle_id"
                                name="vehicle_id"
                                required
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                value={selectedVehicleId}
                                onChange={(event) => setSelectedVehicleId(event.target.value)}
                            >
                                <option value="">Fahrzeug auswählen</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.internal_number} · {getVehicleDisplayName(vehicle)} ·
                                        EK netto {formatCurrency(vehicle.purchase_price_net)}
                                    </option>
                                ))}
                            </select>

                            {vehicles.length === 0 ? (
                                <p className="text-sm font-bold text-amber-700">
                                    Es gibt aktuell keine verfügbaren Fahrzeuge im Bestand.
                                    Lege zuerst einen Ankauf an oder prüfe reservierte Fahrzeuge.
                                </p>
                            ) : null}

                            {selectedVehicle?.sale_price_net ? (
                                <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
                                    <p className="font-extrabold text-cyan-950">
                                        Geplanter Netto-VK:{" "}
                                        {formatCurrency(selectedVehicle.sale_price_net)} netto
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-cyan-800">
                                        Dieser Wert dient als Orientierung und kann vom
                                        tatsächlichen Verkaufspreis abweichen.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={UserRound}
                            title="Käufer"
                            description="Wähle einen bestehenden Käufer aus oder lege ihn direkt im Verkauf neu an."
                        />

                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/60 has-[:checked]:border-cyan-300 has-[:checked]:bg-cyan-50 has-[:checked]:ring-4 has-[:checked]:ring-cyan-100">
                                <input
                                    type="radio"
                                    name="buyer_mode"
                                    value="existing"
                                    checked={buyerMode === "existing"}
                                    onChange={() => setBuyerMode("existing")}
                                    className="sr-only"
                                />
                                <p className="font-extrabold text-slate-950">
                                    Bestehenden Käufer auswählen
                                </p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                                    Für bereits angelegte Kunden und wiederkehrende Käufer.
                                </p>
                            </label>

                            <label className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/60 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50 has-[:checked]:ring-4 has-[:checked]:ring-emerald-100">
                                <input
                                    type="radio"
                                    name="buyer_mode"
                                    value="new"
                                    checked={buyerMode === "new"}
                                    onChange={() => setBuyerMode("new")}
                                    className="sr-only"
                                />
                                <p className="font-extrabold text-slate-950">
                                    Neuen Käufer direkt anlegen
                                </p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                                    Käufer wird automatisch als Kundendatensatz gespeichert.
                                </p>
                            </label>
                        </div>

                        {buyerMode === "existing" ? (
                            <div className="space-y-2">
                                <Label
                                    htmlFor="buyer_customer_id"
                                    className="font-bold text-slate-700"
                                >
                                    Käufer *
                                </Label>

                                <select
                                    id="buyer_customer_id"
                                    name="buyer_customer_id"
                                    required
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    value={selectedCustomerId}
                                    onChange={(event) =>
                                        setSelectedCustomerId(event.target.value)
                                    }
                                >
                                    <option value="">Käufer auswählen</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {getCustomerDisplayName(customer)}
                                        </option>
                                    ))}
                                </select>

                                {customers.length === 0 ? (
                                    <p className="text-sm font-bold text-amber-700">
                                        Es gibt noch keine Kunden. Wähle „Neuen Käufer direkt
                                        anlegen“, um den Käufer im Verkauf zu erfassen.
                                    </p>
                                ) : null}

                                {selectedCustomerMissingTaxNumber ? (
                                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                                        Für Inland-Verkäufe muss beim Kunden eine
                                        Steuernummer hinterlegt sein.
                                    </p>
                                ) : null}

                                {selectedCustomerMissingVatId ? (
                                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                                        Für EU-Verkäufe muss beim Kunden eine
                                        USt-IdNr. hinterlegt sein.
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <div>
                                    <h3 className="text-lg font-extrabold text-emerald-950">
                                        Neuer Käufer
                                    </h3>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">
                                        Diese Daten werden als Kunde gespeichert und anschließend
                                        automatisch für Rechnung, Übergabeprotokoll und weitere
                                        Dokumente verwendet.
                                    </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <label className="cursor-pointer rounded-2xl border border-white bg-white p-4 shadow-sm transition has-[:checked]:border-cyan-300 has-[:checked]:ring-4 has-[:checked]:ring-cyan-100">
                                        <input
                                            type="radio"
                                            name="new_customer_type"
                                            value="company"
                                            checked={newCustomerType === "company"}
                                            onChange={() => setNewCustomerType("company")}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-950">Firma</p>
                                                <p className="text-sm font-medium text-slate-500">
                                                    Händler, GmbH, Exportkunde
                                                </p>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="cursor-pointer rounded-2xl border border-white bg-white p-4 shadow-sm transition has-[:checked]:border-cyan-300 has-[:checked]:ring-4 has-[:checked]:ring-cyan-100">
                                        <input
                                            type="radio"
                                            name="new_customer_type"
                                            value="private"
                                            checked={newCustomerType === "private"}
                                            onChange={() => setNewCustomerType("private")}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                                <UserRound className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-950">
                                                    Privatperson
                                                </p>
                                                <p className="text-sm font-medium text-slate-500">
                                                    Einzelperson als Käufer
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {newCustomerType === "company" ? (
                                        <>
                                            <FormField
                                                label="Firmenname *"
                                                name="new_customer_company_name"
                                                required
                                            />
                                            <FormField
                                                label="Inhaber / Ansprechpartner"
                                                name="new_customer_owner_name"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <FormField
                                                label="Vorname *"
                                                name="new_customer_first_name"
                                                required
                                            />
                                            <FormField
                                                label="Nachname *"
                                                name="new_customer_last_name"
                                                required
                                            />
                                        </>
                                    )}

                                    <FormField
                                        label="Straße und Hausnummer *"
                                        name="new_customer_street"
                                        required
                                    />
                                    <FormField
                                        label="PLZ *"
                                        name="new_customer_postal_code"
                                        required
                                    />
                                    <FormField
                                        label="Ort *"
                                        name="new_customer_city"
                                        required
                                    />
                                    <FormField
                                        label="Land"
                                        name="new_customer_country"
                                        defaultValue="Deutschland"
                                    />
                                    <FormField
                                        label="E-Mail"
                                        name="new_customer_email"
                                        type="email"
                                    />
                                    <FormField
                                        label="Telefon"
                                        name="new_customer_phone"
                                        type="tel"
                                        pattern={phoneInputPattern}
                                        title="Bitte gib eine gültige Telefonnummer ein."
                                        onInput={(event) => {
                                            event.currentTarget.value = sanitizePhoneInput(
                                                event.currentTarget.value,
                                            );
                                        }}
                                    />
                                    <FormField
                                        label={getRequiredLabel(
                                            "USt-ID",
                                            requiresNewCustomerVatId,
                                        )}
                                        name="new_customer_vat_id"
                                        required={requiresNewCustomerVatId}
                                    />
                                    <FormField
                                        label={getRequiredLabel(
                                            "Steuernummer",
                                            requiresNewCustomerTaxNumber,
                                        )}
                                        name="new_customer_tax_number"
                                        required={requiresNewCustomerTaxNumber}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Globe2}
                            title="Verkaufstyp"
                            description="Der Verkaufstyp bestimmt automatisch die Pflichtdokumente."
                        />

                        <div className="grid gap-3 md:grid-cols-3">
                            <SaleTypeOption
                                value="inland"
                                title="Inland"
                                description="Normaler Verkauf innerhalb Deutschlands."
                                checked={saleType === "inland"}
                                onChange={handleSaleTypeChange}
                            />
                            <SaleTypeOption
                                value="eu"
                                title="EU-Verkauf"
                                description="Gelangensbestätigung und Verbringungsnachweis nötig."
                                checked={saleType === "eu"}
                                onChange={handleSaleTypeChange}
                            />
                            <SaleTypeOption
                                value="export_third_country"
                                title="Drittlandexport"
                                description="ABD, Ausgangsvermerk und Exportdokumente nötig."
                                checked={saleType === "export_third_country"}
                                onChange={handleSaleTypeChange}
                            />
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start gap-3">
                                <Info className="mt-0.5 size-5 shrink-0 text-cyan-700" />
                                <p className="text-sm font-semibold leading-6 text-slate-700">
                                    {getTaxHint(saleType)}
                                </p>
                            </div>
                        </div>

                        <div
                            className={
                                requiresExportDetails
                                    ? "rounded-3xl border border-amber-200 bg-amber-50 p-4"
                                    : "rounded-3xl border border-cyan-100 bg-cyan-50 p-4"
                            }
                        >
                            <div className="flex items-start gap-3">
                                <Info
                                    className={
                                        requiresExportDetails
                                            ? "mt-0.5 size-5 shrink-0 text-amber-700"
                                            : "mt-0.5 size-5 shrink-0 text-cyan-700"
                                    }
                                />
                                <p
                                    className={
                                        requiresExportDetails
                                            ? "text-sm font-semibold leading-6 text-amber-950"
                                            : "text-sm font-semibold leading-6 text-cyan-950"
                                    }
                                >
                                    {requiresExportDetails
                                        ? "Für EU-Verkäufe und Drittlandexporte sind diese Angaben erforderlich, damit Gelangensbestätigung und Verbringungsnachweis erstellt werden können."
                                        : "Bei Inland-Verkäufen sind Export- und Verbringungsdaten optional."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Globe2}
                            title="Export / EU-Lieferung"
                            description={
                                requiresExportDetails
                                    ? "Pflichtangaben für Gelangensbestätigung und Verbringungsnachweis."
                                    : "Optionale Angaben für Gelangensbestätigung und Verbringungsnachweis."
                            }
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label={getRequiredLabel(
                                    "Zielort / Empfangsort",
                                    requiresExportDetails,
                                )}
                                name="export_destination_city"
                                required={requiresExportDetails}
                                placeholder="z. B. Wien"
                            />

                            <FormField
                                label={getRequiredLabel(
                                    "Zielland / Empfangsland",
                                    requiresExportDetails,
                                )}
                                name="export_destination_country"
                                required={requiresExportDetails}
                                placeholder="z. B. Österreich"
                            />

                            <div className="space-y-2">
                                <Label
                                    htmlFor="export_arrival_month"
                                    className="font-bold text-slate-700"
                                >
                                    {getRequiredLabel(
                                        "Monat des Gelangens",
                                        requiresExportDetails,
                                    )}
                                </Label>
                                <select
                                    id="export_arrival_month"
                                    name="export_arrival_month"
                                    required={requiresExportDetails}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    defaultValue=""
                                >
                                    {monthOptions.map((option) => (
                                        <option key={option.value || "empty"} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="export_arrival_year"
                                    className="font-bold text-slate-700"
                                >
                                    {getRequiredLabel(
                                        "Jahr des Gelangens",
                                        requiresExportDetails,
                                    )}
                                </Label>
                                <select
                                    id="export_arrival_year"
                                    name="export_arrival_year"
                                    required={requiresExportDetails}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    defaultValue=""
                                >
                                    {getYearOptions().map((year) => (
                                        <option key={year || "empty"} value={year}>
                                            {year || "Bitte wählen"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <FormField
                                label={getRequiredLabel(
                                    "Verbringungs- / Übergabedatum",
                                    requiresExportDetails,
                                )}
                                name="export_transport_date"
                                type="date"
                                required={requiresExportDetails}
                            />

                            <div className="space-y-2">
                                <Label
                                    htmlFor="export_transport_type"
                                    className="font-bold text-slate-700"
                                >
                                    {getRequiredLabel(
                                        "Art der Verbringung",
                                        requiresExportDetails,
                                    )}
                                </Label>
                                <select
                                    id="export_transport_type"
                                    name="export_transport_type"
                                    required={requiresExportDetails}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    defaultValue=""
                                >
                                    <option value="">Bitte wählen</option>
                                    <option value="self_pickup">
                                        Abnehmer befördert selbst
                                    </option>
                                    <option value="customer_forwarder">
                                        Spedition / Beauftragter des Abnehmers
                                    </option>
                                    <option value="seller_transport">
                                        Lieferung durch WAW
                                    </option>
                                    <option value="other">Sonstiges</option>
                                </select>
                            </div>

                            <FormField
                                label={getRequiredLabel(
                                    "Empfänger / Unterzeichner",
                                    requiresExportDetails,
                                )}
                                name="export_receiver_name"
                                required={requiresExportDetails}
                                placeholder="Name der unterschreibenden Person"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Receipt}
                            title="Verkaufsdaten"
                            description="Preis, Datum, MwSt. und automatische Rechnungsnummer."
                        />

                        <div className="grid gap-4 md:grid-cols-3">
                            <FormField
                                label="Verkaufspreis netto *"
                                name="net_amount"
                                type="number"
                                step="0.01"
                                value={netAmount}
                                onChange={(event) => setNetAmount(event.target.value)}
                                required
                            />
                            <FormField
                                label="MwSt.-Satz"
                                name="vat_rate"
                                type="number"
                                step="0.01"
                                value={vatRate}
                                onChange={(event) => setVatRate(event.target.value)}
                            />
                            <FormField
                                label="Verkaufsdatum *"
                                name="sale_date"
                                type="date"
                                defaultValue={today}
                                required
                            />
                        </div>

                        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                            <AmountPreview label="Netto" value={previewNetAmount} />
                            <AmountPreview label="MwSt." value={previewVatAmount} />
                            <AmountPreview label="Brutto" value={previewGrossAmount} />
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
                            <input
                                type="checkbox"
                                name="create_invoice"
                                value="yes"
                                defaultChecked
                                className="mt-1 size-4 rounded border-cyan-300 text-cyan-700"
                            />
                            <div>
                                <p className="font-extrabold text-cyan-950">
                                    Rechnung automatisch erzeugen
                                </p>
                                <p className="mt-1 text-sm font-medium text-cyan-800">
                                    Erstellt direkt einen Rechnungsdatensatz mit der nächsten
                                    Rechnungsnummer und speichert die PDF in Supabase.
                                </p>
                            </div>
                        </label>

                        {selectedVehicle?.damage_notes ? (
                            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                                <input
                                    type="checkbox"
                                    name="include_damage_notes_on_invoice"
                                    value="yes"
                                    className="mt-1 size-4 rounded border-amber-300 text-amber-700"
                                />
                                <div>
                                    <p className="font-extrabold text-amber-950">
                                        Schäden auf Rechnung aufführen
                                    </p>
                                    <p className="mt-1 text-sm font-medium leading-6 text-amber-900">
                                        Die beim Fahrzeug hinterlegten Schäden werden als Hinweis
                                        auf der Rechnung ausgegeben.
                                    </p>
                                </div>
                            </label>
                        ) : null}

                        {selectedVehicle?.sale_price_net ? (
                            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <input
                                    type="checkbox"
                                    name="include_planned_net_sale_price_note"
                                    value="yes"
                                    defaultChecked
                                    className="mt-1 size-4 rounded border-cyan-300 text-cyan-700"
                                />
                                <div>
                                    <p className="font-extrabold text-slate-950">
                                        Geplanten Netto-VK als Notiz übernehmen
                                    </p>
                                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                                        Übernimmt den Planwert aus dem Fahrzeugbestand als
                                        Rechnungsnotiz.
                                    </p>
                                </div>
                            </label>
                        ) : null}

                        <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                            <input
                                type="checkbox"
                                name="include_signature_stamp"
                                value="yes"
                                className="mt-1 size-4 rounded border-slate-300 text-cyan-700"
                            />
                            <div>
                                <p className="font-extrabold text-slate-950">
                                    Unterschrift & Stempel einfügen
                                </p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                                    Fügt die in den Einstellungen hinterlegte digitale
                                    Unterschrift und den Firmenstempel in die automatisch
                                    erzeugte Rechnung ein.
                                </p>
                            </div>
                        </label>

                        <div className="grid gap-4 md:grid-cols-[1fr_0.6fr]">
                            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                                <input
                                    type="checkbox"
                                    name="create_cashbook_entry"
                                    value="yes"
                                    defaultChecked
                                    className="mt-1 size-4 rounded border-emerald-300 text-emerald-700"
                                />
                                <div>
                                    <p className="font-extrabold text-emerald-950">
                                        Zahlung direkt im Kassenbuch erfassen
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-emerald-800">
                                        Erstellt automatisch eine Einnahme mit dem Bruttobetrag.
                                    </p>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="payment_method"
                                    className="font-bold text-slate-700"
                                >
                                    Zahlungsart
                                </Label>
                                <select
                                    id="payment_method"
                                    name="payment_method"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    defaultValue="bank"
                                >
                                    <option value="bank">Bank</option>
                                    <option value="cash">Bar</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={CalendarDays}
                            title="Notizen"
                            description="Interne Hinweise zum Verkauf."
                        />

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="font-bold text-slate-700">
                                Notizen
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="z. B. Zahlungsvereinbarung, Exporthinweise, offene Dokumente..."
                                className="min-h-32 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/85 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
                    <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                        <Button
                            asChild
                            type="button"
                            variant="outline"
                            className="h-12 rounded-2xl border-slate-200 bg-white font-bold"
                        >
                            <Link href="/dashboard/sales">Abbrechen</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending || vehicles.length === 0}
                            className="h-12 rounded-2xl bg-cyan-700 px-6 font-extrabold text-white hover:bg-cyan-800"
                        >
                            <Save className="mr-2 size-4" />
                            {isPending ? "Speichert..." : "Verkauf speichern"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function SaleTypeOption({
                            value,
                            title,
                            description,
                            checked,
                            onChange,
                        }: {
    value: SaleType;
    title: string;
    description: string;
    checked: boolean;
    onChange: (value: SaleType) => void;
}) {
    return (
        <label className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/60 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50 has-[:checked]:ring-4 has-[:checked]:ring-emerald-100">
            <input
                type="radio"
                name="sale_type"
                value={value}
                checked={checked}
                onChange={() => onChange(value)}
                className="sr-only"
            />
            <p className="font-extrabold text-slate-950">{title}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                {description}
            </p>
        </label>
    );
}

function getRequiredLabel(label: string, required: boolean): string {
    return required ? `${label} *` : label;
}

function SectionTitle({
                          icon: Icon,
                          title,
                          description,
                      }: {
    icon: typeof Truck;
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

function AmountPreview({ label, value }: { label: string; value: number }) {
    return (
        <div className="min-w-0 rounded-2xl border border-white bg-white p-3 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-1 truncate text-lg font-extrabold text-slate-950">
                {formatCurrency(value)}
            </p>
        </div>
    );
}

function FormField({
                       label,
                       name,
                       type = "text",
                       required = false,
                       defaultValue,
                       placeholder,
                       step,
                       value,
                       onChange,
                       pattern,
                       title,
                       onInput,
                   }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    placeholder?: string;
    step?: string;
    value?: string;
    onChange?: ChangeEventHandler<HTMLInputElement>;
    pattern?: string;
    title?: string;
    onInput?: FormEventHandler<HTMLInputElement>;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="font-bold text-slate-700">
                {label}
            </Label>
            <Input
                id={name}
                name={name}
                type={type}
                required={required}
                defaultValue={defaultValue}
                placeholder={placeholder}
                step={step}
                value={value}
                onChange={onChange}
                pattern={pattern}
                title={title}
                onInput={onInput}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-medium"
            />
        </div>
    );
}
