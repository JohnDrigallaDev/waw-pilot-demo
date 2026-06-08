"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateCompanySettingsState = {
    success: boolean;
    message: string;
    values: {
        legal_name: string;
        street: string;
        postal_code: string;
        city: string;
        country: string;
        email: string;
        phone: string;
        vat_id: string;
        tax_number: string;
    };
};

function getStringValue(formData: FormData, key: string): string {
    const value = formData.get(key);

    if (typeof value !== "string") return "";

    return value.trim();
}

function getFormValues(formData: FormData): UpdateCompanySettingsState["values"] {
    return {
        legal_name: getStringValue(formData, "legal_name"),
        street: getStringValue(formData, "street"),
        postal_code: getStringValue(formData, "postal_code"),
        city: getStringValue(formData, "city"),
        country: getStringValue(formData, "country") || "Deutschland",
        email: getStringValue(formData, "email"),
        phone: getStringValue(formData, "phone"),
        vat_id: getStringValue(formData, "vat_id"),
        tax_number: getStringValue(formData, "tax_number"),
    };
}

export async function updateCompanySettingsAction(
    _previousState: UpdateCompanySettingsState,
    formData: FormData,
): Promise<UpdateCompanySettingsState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const values = getFormValues(formData);

    if (!values.legal_name) {
        return {
            success: false,
            message: "Bitte gib den Firmennamen ein.",
            values,
        };
    }

    if (!values.street) {
        return {
            success: false,
            message: "Bitte gib die Straße ein.",
            values,
        };
    }

    if (!values.postal_code) {
        return {
            success: false,
            message: "Bitte gib die Postleitzahl ein.",
            values,
        };
    }

    if (!values.city) {
        return {
            success: false,
            message: "Bitte gib den Ort ein.",
            values,
        };
    }

    const { data, error } = await supabase
        .from("companies")
        .update({
            legal_name: values.legal_name,
            street: values.street,
            postal_code: values.postal_code,
            city: values.city,
            country: values.country,
            email: values.email || null,
            phone: values.phone || null,
            vat_id: values.vat_id || null,
            tax_number: values.tax_number || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", companyId)
        .select("id")
        .maybeSingle();

    if (error) {
        return {
            success: false,
            message: `Firmendaten konnten nicht gespeichert werden: ${error.message}`,
            values,
        };
    }

    if (!data) {
        return {
            success: false,
            message:
                "Firmendaten konnten nicht gespeichert werden: Es wurde kein passender Firmendatensatz gefunden oder die RLS-Policy blockiert das Update.",
            values,
        };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/reports");

    redirect("/dashboard/settings");
}