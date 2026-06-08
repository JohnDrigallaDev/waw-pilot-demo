"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CalendarDays, FileText, Save, Truck, UserRound } from "lucide-react";

import { createTravelExpenseFormAction } from "@/app/dashboard/reports/travel-expenses/new/actions";
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

export function TravelExpenseForm() {
    const [state, formAction, isPending] = useActionState(
        createTravelExpenseFormAction,
        initialState,
    );

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Reisekostenformular"
                title="Reisekostenformular erstellen"
                description="Interne Fahrt dokumentieren und automatisch als PDF speichern."
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href="/dashboard/reports">Zurück</Link>
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
                            icon={UserRound}
                            title="Fahrer / Mitarbeiter"
                            description="Wer hat die Fahrt durchgeführt?"
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label="Mitarbeiter / Fahrer *"
                                name="driver_name"
                                required
                                placeholder="z. B. Max Mustermann"
                            />

                            <FormField
                                label="Datum *"
                                name="travel_date"
                                type="date"
                                defaultValue={today}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={Truck}
                            title="Fahrt"
                            description="Kunde, Ort, Fahrzeug und Zweck der Fahrt."
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label="Besuchter Kunde / Firma *"
                                name="visited_customer"
                                required
                                placeholder="z. B. Müller GmbH"
                            />

                            <FormField
                                label="Ort *"
                                name="location"
                                required
                                placeholder="z. B. Berlin"
                            />

                            <FormField
                                label="Fahrzeug / Kennzeichen *"
                                name="vehicle_or_plate"
                                required
                                placeholder="z. B. HH-WA 123"
                            />

                            <FormField
                                label="Zweck der Fahrt *"
                                name="purpose"
                                required
                                placeholder="z. B. Fahrzeugabholung"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <SectionTitle
                            icon={CalendarDays}
                            title="Kilometer & Hinweise"
                            description="Optionale Kilometerdaten und interne Bemerkungen."
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label="Startkilometer"
                                name="start_mileage"
                                type="number"
                                placeholder="z. B. 120000"
                            />

                            <FormField
                                label="Endkilometer"
                                name="end_mileage"
                                type="number"
                                placeholder="z. B. 120430"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="font-bold text-slate-700">
                                Bemerkungen
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="z. B. Belege liegen bei, Fahrt mit Kundenbesuch kombiniert..."
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
                            <Link href="/dashboard/reports">Abbrechen</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 rounded-2xl bg-cyan-700 px-6 font-extrabold text-white hover:bg-cyan-800"
                        >
                            <Save className="mr-2 size-4" />
                            {isPending ? "Erzeugt PDF..." : "PDF erzeugen"}
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
    icon: typeof FileText;
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
                required={required}
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-medium"
            />
        </div>
    );
}