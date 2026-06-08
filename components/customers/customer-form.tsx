"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Building2, Save, UserRound } from "lucide-react";

import { createCustomerAction } from "@/app/dashboard/customers/new/actions";
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

export function CustomerForm() {
    const [state, formAction, isPending] = useActionState(
        createCustomerAction,
        initialState,
    );

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Neuer Kunde"
                title="Kunde anlegen"
                description="Firmenkunden und Privatpersonen erfassen und direkt in Supabase speichern."
                action={
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-2xl border-slate-200 bg-white font-bold"
                    >
                        <Link href="/dashboard/customers">Zurück</Link>
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
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Kundentyp
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Wähle, ob der Kunde eine Firma oder Privatperson ist.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="group cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/60">
                                <input
                                    type="radio"
                                    name="type"
                                    value="company"
                                    defaultChecked
                                    className="peer sr-only"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 peer-checked:bg-cyan-700">
                                        <Building2 className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-950">Firma</p>
                                        <p className="text-sm font-medium text-slate-500">
                                            GmbH, Händler, Exportkunde
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <label className="group cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-cyan-200 hover:bg-cyan-50/60">
                                <input
                                    type="radio"
                                    name="type"
                                    value="private"
                                    className="peer sr-only"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
                                        <UserRound className="size-5" />
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-slate-950">Privatperson</p>
                                        <p className="text-sm font-medium text-slate-500">
                                            Einzelperson als Käufer/Verkäufer
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Stammdaten
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Name, Ansprechpartner und Kontaktdaten.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Firmenname" name="company_name" />
                            <FormField label="Inhaber / Ansprechpartner" name="owner_name" />
                            <FormField label="Vorname" name="first_name" />
                            <FormField label="Nachname" name="last_name" />
                            <FormField label="E-Mail" name="email" type="email" />
                            <FormField label="Telefon" name="phone" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Adresse
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Rechnungs- und Kundendaten.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Straße und Hausnummer *" name="street" required />
                            <FormField label="PLZ *" name="postal_code" required />
                            <FormField label="Ort *" name="city" required />
                            <FormField label="Land" name="country" defaultValue="Deutschland" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-slate-200 bg-white/90 shadow-sm">
                    <CardContent className="space-y-5 p-5">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-950">
                                Steuer & Register
                            </h2>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Optional für Rechnungen, Export und Pflichtprüfung.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <FormField label="Steuernummer" name="tax_number" />
                            <FormField label="USt-ID" name="vat_id" />
                            <FormField
                                label="Handelsregister"
                                name="commercial_register_number"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="font-bold text-slate-700">
                                Notizen
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Interne Hinweise zum Kunden..."
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
                            <Link href="/dashboard/customers">Abbrechen</Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 rounded-2xl bg-cyan-700 px-6 font-extrabold text-white hover:bg-cyan-800"
                        >
                            <Save className="mr-2 size-4" />
                            {isPending ? "Speichert..." : "Kunde speichern"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function FormField({
                       label,
                       name,
                       type = "text",
                       required = false,
                       defaultValue,
                   }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    defaultValue?: string;
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
                className="h-11 rounded-2xl border-slate-200 bg-slate-50 font-medium"
            />
        </div>
    );
}