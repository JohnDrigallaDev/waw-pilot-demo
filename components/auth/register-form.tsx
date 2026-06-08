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

            <div className="space-y-2">
                <label
                    htmlFor="email"
                    className="text-sm font-bold text-slate-200"
                >
                    E-Mail
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/10"
                    placeholder="name@firma.de"
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="password"
                    className="text-sm font-bold text-slate-200"
                >
                    Passwort
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/10"
                    placeholder="Mindestens 6 Zeichen"
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="password_confirm"
                    className="text-sm font-bold text-slate-200"
                >
                    Passwort bestätigen
                </label>
                <input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/10"
                    placeholder="Passwort wiederholen"
                />
            </div>

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