"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    Save,
    ShoppingCart,
    Truck,
    Wallet,
} from "lucide-react";

import { createPurchaseCaseAction } from "@/app/dashboard/ankauf/new/actions";
import { updatePurchaseCaseAction } from "@/app/dashboard/ankauf/[purchaseId]/edit/actions";
import type { PurchaseFormData } from "@/lib/purchases/purchase-form-data";
import type { PurchaseCasePaymentStatus } from "@/lib/purchases/purchase-queries";
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

type PurchaseFormInitialValues = {
    id?: string;
    vehicle_id?: string | null;
    seller_customer_id?: string | null;
    purchase_date?: string | null;
    net_amount?: number | null;
    vat_rate?: number | null;
    payment_status?: PurchaseCasePaymentStatus | null;
    notes?: string | null;
};

type PurchaseFormProps = {
    formData: PurchaseFormData;
    mode?: "create" | "edit";
    initialValues?: PurchaseFormInitialValues;
};

export function PurchaseForm({
                                 formData,
                                 mode = "create",
                                 initialValues,
                             }: PurchaseFormProps) {
    const action =
        mode === "edit" ? updatePurchaseCaseAction : createPurchaseCaseAction;

    const [state, formAction, isPending] = useActionState(action, initialState);

    const today = new Date().toISOString().slice(0, 10);

    const backHref =
        mode === "edit" && initialValues?.id
            ? `/dashboard/ankauf/${initialValues.id}`
            : "/dashboard/ankauf";

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Fahrzeug ankaufen"
                title={
                    mode === "edit"
                        ? "Fahrzeugankauf bearbeiten"
                        : "Fahrzeug ankaufen"
                }
                description={
                    mode === "edit"
                        ? "Bearbeite Verkäufer, Fahrzeug, Einkaufspreis, Zahlungsstatus und Notizen."
                        : "Erfasse ein gekauftes Fahrzeug mit Verkäuferdaten, Einkaufspreis und Zahlungsstatus."
                }
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href={backHref}>
                            <ArrowLeft className="mr-2 size-4" />
                            Zurück
                        </Link>
                    </Button>
                }
            />

            <form action={formAction} className="space-y-6">
                {initialValues?.id ? (
                    <input type="hidden" name="purchase_id" value={initialValues.id} />
                ) : null}

                {state.message ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {state.message}
                    </div>
                ) : null}

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={ShoppingCart}
                            title="Fahrzeug & Verkäufer"
                            description="Wähle das gekaufte Fahrzeug und den Verkäufer aus."
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField
                                label="Fahrzeug *"
                                name="vehicle_id"
                                placeholder="Fahrzeug auswählen"
                                options={formData.vehicles}
                                defaultValue={initialValues?.vehicle_id ?? ""}
                                required
                            />

                            <SelectField
                                label="Verkäufer *"
                                name="seller_customer_id"
                                placeholder="Verkäufer auswählen"
                                options={formData.sellers}
                                defaultValue={initialValues?.seller_customer_id ?? ""}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={CalendarDays}
                            title="Datum & Zahlung"
                            description="Ankaufsdatum und Zahlungsstatus festlegen."
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label="Ankaufsdatum *"
                                name="purchase_date"
                                type="date"
                                defaultValue={initialValues?.purchase_date ?? today}
                                required
                            />

                            <div className="space-y-2">
                                <Label
                                    htmlFor="payment_status"
                                    className="font-bold text-slate-700"
                                >
                                    Zahlungsstatus *
                                </Label>
                                <select
                                    id="payment_status"
                                    name="payment_status"
                                    defaultValue={initialValues?.payment_status ?? "open"}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                >
                                    <option value="open">Offen</option>
                                    <option value="partial">Teilweise bezahlt</option>
                                    <option value="paid">Bezahlt</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Wallet}
                            title="Beträge"
                            description="Netto-Betrag und Mehrwertsteuer erfassen."
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label="Einkaufspreis netto *"
                                name="net_amount"
                                type="number"
                                defaultValue={
                                    initialValues?.net_amount !== undefined &&
                                    initialValues?.net_amount !== null
                                        ? String(initialValues.net_amount)
                                        : ""
                                }
                                placeholder="z. B. 25000"
                                required
                            />

                            <FormField
                                label="MwSt. %"
                                name="vat_rate"
                                type="number"
                                defaultValue={
                                    initialValues?.vat_rate !== undefined &&
                                    initialValues?.vat_rate !== null
                                        ? String(initialValues.vat_rate)
                                        : "19"
                                }
                                placeholder="19"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={ClipboardList}
                            title="Notizen"
                            description="Interne Hinweise zur Ankaufsakte."
                        />

                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={initialValues?.notes ?? ""}
                            placeholder="Interne Hinweise zum Ankauf..."
                            className="min-h-28 rounded-2xl border-slate-200 bg-slate-50 font-medium"
                        />
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
                            <Link href={backHref}>Abbrechen</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 rounded-2xl bg-cyan-700 px-6 font-extrabold text-white hover:bg-cyan-800"
                        >
                            <Save className="mr-2 size-4" />
                            {isPending
                                ? "Speichert..."
                                : mode === "edit"
                                    ? "Änderungen speichern"
                                    : "Fahrzeug ankaufen"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
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

function FormField({
                       label,
                       name,
                       type = "text",
                       required = false,
                       defaultValue,
                       placeholder,
                   }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    placeholder?: string;
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
                step={type === "number" ? "0.01" : undefined}
                required={required}
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-medium"
            />
        </div>
    );
}

function SelectField({
                         label,
                         name,
                         placeholder,
                         options,
                         defaultValue = "",
                         required = false,
                     }: {
    label: string;
    name: string;
    placeholder: string;
    options: { id: string; label: string }[];
    defaultValue?: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="font-bold text-slate-700">
                {label}
            </Label>
            <select
                id={name}
                name={name}
                required={required}
                defaultValue={defaultValue}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
