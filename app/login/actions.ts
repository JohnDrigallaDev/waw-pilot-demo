"use server";

import { redirect } from "next/navigation";

import { createAuthServerSupabaseClient } from "@/lib/supabase/auth-server";

type LoginState = {
    success: boolean;
    message: string;
};

function getStringValue(formData: FormData, key: string): string {
    const value = formData.get(key);

    if (typeof value !== "string") return "";

    return value.trim();
}

export async function loginAction(
    _previousState: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const supabase = await createAuthServerSupabaseClient();

    const email = getStringValue(formData, "email");
    const password = getStringValue(formData, "password");
    const redirectedFrom = getStringValue(formData, "redirected_from");

    if (!email) {
        return {
            success: false,
            message: "Bitte gib deine E-Mail-Adresse ein.",
        };
    }

    if (!password) {
        return {
            success: false,
            message: "Bitte gib dein Passwort ein.",
        };
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return {
            success: false,
            message: `Login fehlgeschlagen: ${error.message}`,
        };
    }

    redirect(redirectedFrom || "/dashboard");
}