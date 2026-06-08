"use server";

import { redirect } from "next/navigation";

import { createAuthServerSupabaseClient } from "@/lib/supabase/auth-server";

type RegisterState = {
    success: boolean;
    message: string;
};

function getStringValue(formData: FormData, key: string): string {
    const value = formData.get(key);

    if (typeof value !== "string") return "";

    return value.trim();
}

export async function registerAction(
    _previousState: RegisterState,
    formData: FormData,
): Promise<RegisterState> {
    const supabase = await createAuthServerSupabaseClient();

    const email = getStringValue(formData, "email");
    const password = getStringValue(formData, "password");
    const passwordConfirm = getStringValue(formData, "password_confirm");

    if (!email) {
        return {
            success: false,
            message: "Bitte gib deine E-Mail-Adresse ein.",
        };
    }

    if (!password) {
        return {
            success: false,
            message: "Bitte gib ein Passwort ein.",
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        };
    }

    if (password !== passwordConfirm) {
        return {
            success: false,
            message: "Die Passwörter stimmen nicht überein.",
        };
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return {
            success: false,
            message: `Registrierung fehlgeschlagen: ${error.message}`,
        };
    }

    redirect("/dashboard");
}