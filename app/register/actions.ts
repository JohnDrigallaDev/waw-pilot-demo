"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
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
    const companyId = getCurrentCompanyId();

    const firstName = getStringValue(formData, "first_name");
    const lastName = getStringValue(formData, "last_name");
    const email = getStringValue(formData, "email");
    const password = getStringValue(formData, "password");
    const passwordConfirm = getStringValue(formData, "password_confirm");

    if (!firstName) {
        return {
            success: false,
            message: "Bitte gib deinen Vornamen ein.",
        };
    }

    if (!lastName) {
        return {
            success: false,
            message: "Bitte gib deinen Nachnamen ein.",
        };
    }

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

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`,
            },
        },
    });

    if (error) {
        return {
            success: false,
            message: `Registrierung fehlgeschlagen: ${error.message}`,
        };
    }

    if (!data.user) {
        return {
            success: false,
            message: "Benutzer wurde angelegt, aber die Benutzer-ID konnte nicht ermittelt werden.",
        };
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
        {
            id: data.user.id,
            company_id: companyId,
            auth_user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email,
            role: "user",
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "auth_user_id",
        },
    );

    if (profileError) {
        return {
            success: false,
            message: `Profil konnte nicht gespeichert werden: ${profileError.message}`,
        };
    }

    redirect("/dashboard");
}