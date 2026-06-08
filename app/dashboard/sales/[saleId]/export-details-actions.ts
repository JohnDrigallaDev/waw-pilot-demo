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

export async function updateSaleExportDetailsAction(formData: FormData) {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const saleId = getStringValue(formData, "sale_id");

    if (!saleId) {
        throw new Error("Verkauf fehlt.");
    }

    const destinationCity = getStringValue(formData, "export_destination_city");
    const destinationCountry = getStringValue(
        formData,
        "export_destination_country",
    );
    const arrivalMonth = getStringValue(formData, "export_arrival_month");
    const arrivalYear = getStringValue(formData, "export_arrival_year");
    const transportDate = getStringValue(formData, "export_transport_date");
    const transportType = getStringValue(formData, "export_transport_type");
    const receiverName = getStringValue(formData, "export_receiver_name");

    const { data, error } = await supabase
        .from("sales")
        .update({
            export_destination_city: destinationCity,
            export_destination_country: destinationCountry,
            export_arrival_month: arrivalMonth,
            export_arrival_year: arrivalYear,
            export_transport_date: transportDate,
            export_transport_type: transportType,
            export_receiver_name: receiverName,
        })
        .eq("id", saleId)
        .eq("company_id", companyId)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        throw new Error(
            `Export-/Verbringungsdaten konnten nicht gespeichert werden: ${
                error?.message ??
                "Es wurde kein passender Verkaufsdatensatz gefunden oder die RLS-Policy blockiert das Update."
            }`,
        );
    }

    revalidatePath(`/dashboard/sales/${saleId}`);
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/documents");
    revalidatePath("/dashboard/checks");

    redirect(`/dashboard/sales/${saleId}#export-details`);
}