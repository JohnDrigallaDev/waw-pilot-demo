"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import { registerAction } from "@/app/register/actions";

const initialState = {
    success: false,
    message: "",
};

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState(
        registerAction,
        initialState,
    );

    return (
        <form action={formAction} className="mt-6 space-y-4">
            {state.message ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                    {state.message}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                <AuthField
                    label="Vorname"
                    name="first_name"
                    autoComplete="given-name"
                    placeholder="Max"
                    required
                />
                <AuthField
                    label="Nachname"
                    name="last_name"
                    autoComplete="family-name"
                    placeholder="Mustermann"
                    required
                />
            </div>

            <AuthField
                label="E-Mail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@firma.de"
                required
            />

            <AuthField
                label="Passwort"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mindestens 6 Zeichen"
                required
            />

            <AuthField
                label="Passwort bestätigen"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Passwort wiederholen"
                required
            />

            <button
                type="submit"
                disabled={isPending}
                className="group h-12 w-full rounded-2xl bg-cyan-500 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
                <span className="inline-flex items-center justify-center">
                    <UserPlus className="mr-2 size-4 transition-transform group-hover:scale-110" />
                    {isPending ? "Erstelle Konto..." : "Registrieren"}
                </span>
            </button>
        </form>
    );
}

function AuthField({
                       label,
                       name,
                       type = "text",
                       autoComplete,
                       placeholder,
                       required = false,
                   }: {
    label: string;
    name: string;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={name} className="text-sm font-bold text-slate-200">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                required={required}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/10"
                placeholder={placeholder}
            />
        </div>
    );
}