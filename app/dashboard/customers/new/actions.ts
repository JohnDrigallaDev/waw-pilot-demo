"use server";

import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateCustomerState = {
    success: boolean;
    message: string;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function createCustomerAction(
    _previousState: CreateCustomerState,
    formData: FormData,
): Promise<CreateCustomerState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const type = getStringValue(formData, "type");

    if (type !== "company" && type !== "private") {
        return {
            success: false,
            message: "Bitte wähle einen gültigen Kundentyp aus.",
        };
    }

    const companyName = getStringValue(formData, "company_name");
    const ownerName = getStringValue(formData, "owner_name");
    const firstName = getStringValue(formData, "first_name");
    const lastName = getStringValue(formData, "last_name");

    const street = getStringValue(formData, "street");
    const postalCode = getStringValue(formData, "postal_code");
    const city = getStringValue(formData, "city");
    const country = getStringValue(formData, "country") ?? "Deutschland";

    const email = getStringValue(formData, "email");
    const phone = getStringValue(formData, "phone");
    const taxNumber = getStringValue(formData, "tax_number");
    const vatId = getStringValue(formData, "vat_id");
    const commercialRegisterNumber = getStringValue(
        formData,
        "commercial_register_number",
    );
    const notes = getStringValue(formData, "notes");

    if (!street || !postalCode || !city) {
        return {
            success: false,
            message: "Adresse, PLZ und Ort sind Pflichtfelder.",
        };
    }

    if (type === "company" && !companyName) {
        return {
            success: false,
            message: "Bitte gib einen Firmennamen ein.",
        };
    }

    if (type === "private" && (!firstName || !lastName)) {
        return {
            success: false,
            message: "Bitte gib Vorname und Nachname ein.",
        };
    }

    const { error } = await supabase.from("customers").insert({
        company_id: companyId,
        type,
        company_name: companyName,
        owner_name: ownerName,
        first_name: firstName,
        last_name: lastName,
        street,
        postal_code: postalCode,
        city,
        country,
        email,
        phone,
        tax_number: taxNumber,
        vat_id: vatId,
        commercial_register_number: commercialRegisterNumber,
        notes,
    });

    if (error) {
        return {
            success: false,
            message: `Kunde konnte nicht gespeichert werden: ${error.message}`,
        };
    }

    redirect("/dashboard/customers");
}