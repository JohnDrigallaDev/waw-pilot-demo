"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function updateCustomerMasterDataAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const customerId = getStringValue(formData, "customer_id");

    if (!customerId) {
        throw new Error("Kunde fehlt.");
    }

    const street = getStringValue(formData, "street");
    const postalCode = getStringValue(formData, "postal_code");
    const city = getStringValue(formData, "city");
    const country = getStringValue(formData, "country");
    const email = getStringValue(formData, "email");
    const phone = getStringValue(formData, "phone");
    const vatId = getStringValue(formData, "vat_id");

    const { data, error } = await supabase
        .from("customers")
        .update({
            street,
            postal_code: postalCode,
            city,
            country,
            email,
            phone,
            vat_id: vatId,
        })
        .eq("id", customerId)
        .eq("company_id", companyId)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        throw new Error(
            `Kundendaten konnten nicht gespeichert werden: ${
                error?.message ??
                "Es wurde kein passender Kundendatensatz gefunden oder die RLS-Policy blockiert das Update."
            }`,
        );
    }

    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/checks");

    redirect(`/dashboard/customers/${customerId}`);
}