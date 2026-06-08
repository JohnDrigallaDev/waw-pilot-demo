"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CalendarDays, Save, Truck } from "lucide-react";

import { createVehicleAction } from "@/app/dashboard/vehicles/new/actions";
import type { CustomerRow } from "@/lib/customers/customer-queries";
import { getCustomerDisplayName } from "@/lib/customers/customer-helpers";
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

type VehicleFormProps = {
    customers: CustomerRow[];
};

export function VehicleForm({ customers }: VehicleFormProps) {
    const [state, formAction, isPending] = useActionState(
        createVehicleAction,
        initialState,
    );

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Neuer Ankauf"
                title="Fahrzeug / Ankauf erfassen"
                description="Fahrzeugdaten, Einkaufspreis, geplanten Verkaufspreis und optional Verkäufer-Kunde speichern."
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href="/dashboard/vehicles">Zurück</Link>
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
                            title="Stammdaten"
                            description="Interne Identifikation und technische Basisdaten."
                        />

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <FormField label="Interne Nummer *" name="internal_number" required />
                            <FormField label="Hersteller *" name="manufacturer" required />
                            <FormField label="Modell *" name="model" required />
                            <FormField label="Fahrzeugtyp *" name="vehicle_type" required />
                            <FormField label="FIN / VIN *" name="vin" required />
                            <FormField label="Kennzeichen" name="license_plate" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={CalendarDays}
                            title="Zulassung & Zustand"
                            description="Baujahr, Erstzulassung und relevante Termine."
                        />

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <FormField
                                label="Baujahr"
                                name="construction_year"
                                type="number"
                                placeholder="z. B. 2019"
                            />
                            <FormField
                                label="Erstzulassung"
                                name="first_registration"
                                type="date"
                            />
                            <FormField
                                label="Ankaufsdatum"
                                name="purchase_date"
                                type="date"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Preise & Verkäufer
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Einkaufspreis, Nebenkosten und optionale Kundenzuordnung.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <FormField
                                label="Einkaufspreis netto *"
                                name="purchase_price_net"
                                type="number"
                                step="0.01"
                                required
                            />
                            <FormField
                                label="Geplanter Verkaufspreis netto"
                                name="sale_price_net"
                                type="number"
                                step="0.01"
                            />
                            <FormField
                                label="Nebenkosten netto"
                                name="additional_costs_net"
                                type="number"
                                step="0.01"
                                defaultValue="0"
                            />

                            <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                <Label
                                    htmlFor="seller_customer_id"
                                    className="font-bold text-slate-700"
                                >
                                    Verkäufer-Kunde
                                </Label>
                                <select
                                    id="seller_customer_id"
                                    name="seller_customer_id"
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                                    defaultValue=""
                                >
                                    <option value="">Kein Verkäufer zugeordnet</option>
                                    {customers.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {getCustomerDisplayName(customer)}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs font-semibold text-slate-500">
                                    Wenn du einen Verkäufer auswählst, wird zusätzlich ein Ankauf
                                    in der Tabelle purchases gespeichert.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Notizen
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Interne Hinweise zum Fahrzeug, Zustand oder Ankauf.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="font-bold text-slate-700">
                                Notizen
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="z. B. Zustand, Ausstattung, offene Punkte..."
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
                            <Link href="/dashboard/vehicles">Abbrechen</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 rounded-2xl bg-cyan-700 px-6 font-extrabold text-white hover:bg-cyan-800"
                        >
                            <Save className="mr-2 size-4" />
                            {isPending ? "Speichert..." : "Fahrzeug speichern"}
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
                       step,
                   }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
    placeholder?: string;
    step?: string;
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
                className="h-11 rounded-2xl border-slate-200 bg-slate-50 font-medium"
            />
        </div>
    );
}