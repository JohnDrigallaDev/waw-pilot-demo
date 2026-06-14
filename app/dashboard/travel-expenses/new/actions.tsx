"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import { generateTravelExpenseFormPdf } from "@/lib/pdf/templates/travel-expense-form-pdf";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreateTravelExpenseState = {
    success: boolean;
    message: string;
};

function getStringValue(formData: FormData, key: string): string | null {
    const value = formData.get(key);

    if (typeof value !== "string") return null;

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function getNumberValue(formData: FormData, key: string): number | null {
    const value = getStringValue(formData, key);

    if (!value) return null;

    const numberValue = Number(value.replace(",", "."));

    return Number.isFinite(numberValue) ? numberValue : null;
}

function getSafeFilePart(value: string | null | undefined): string {
    if (!value) return "ohne-angabe";

    return value
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

export async function createTravelExpenseFormAction(
    _previousState: CreateTravelExpenseState,
    formData: FormData,
): Promise<CreateTravelExpenseState> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const driverName = getStringValue(formData, "driver_name");
    const travelDate = getStringValue(formData, "travel_date");
    const visitedCustomer = getStringValue(formData, "visited_customer");
    const location = getStringValue(formData, "location");
    const vehicleOrPlate = getStringValue(formData, "vehicle_or_plate");
    const purpose = getStringValue(formData, "purpose");
    const startMileage = getNumberValue(formData, "start_mileage");
    const endMileage = getNumberValue(formData, "end_mileage");
    const notes = getStringValue(formData, "notes");

    if (!driverName) {
        return {
            success: false,
            message: "Bitte gib den Mitarbeiter oder Fahrer an.",
        };
    }

    if (!travelDate) {
        return {
            success: false,
            message: "Bitte gib das Fahrtdatum an.",
        };
    }

    if (!visitedCustomer) {
        return {
            success: false,
            message: "Bitte gib den besuchten Kunden oder die Firma an.",
        };
    }

    if (!location) {
        return {
            success: false,
            message: "Bitte gib den Ort an.",
        };
    }

    if (!vehicleOrPlate) {
        return {
            success: false,
            message: "Bitte gib Fahrzeug oder Kennzeichen an.",
        };
    }

    if (!purpose) {
        return {
            success: false,
            message: "Bitte gib den Zweck der Fahrt an.",
        };
    }

    const { data: travelForm, error: insertError } = await supabase
        .from("travel_expense_forms")
        .insert({
            company_id: companyId,
            driver_name: driverName,
            travel_date: travelDate,
            visited_customer: visitedCustomer,
            location,
            vehicle_or_plate: vehicleOrPlate,
            purpose,
            start_mileage: startMileage,
            end_mileage: endMileage,
            notes,
        })
        .select("id")
        .single();

    if (insertError || !travelForm) {
        return {
            success: false,
            message: `Reisekostenformular konnte nicht gespeichert werden: ${
                insertError?.message ?? "Keine Formular-ID erhalten"
            }`,
        };
    }

    const travelFormId = travelForm.id as string;

    const pdfBytes = await generateTravelExpenseFormPdf({
        driverName,
        travelDate,
        visitedCustomer,
        location,
        vehicleOrPlate,
        purpose,
        startMileage,
        endMileage,
        notes,
    });

    const fileName = `reisekostenformular-${getSafeFilePart(driverName)}-${travelDate}.pdf`;
    const filePath = `generated-documents/travel-expenses/${travelFormId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBytes, {
            contentType: "application/pdf",
            upsert: true,
        });

    if (uploadError) {
        return {
            success: false,
            message: `PDF konnte nicht gespeichert werden: ${uploadError.message}`,
        };
    }

    const { data: document, error: documentError } = await supabase
        .from("documents")
        .insert({
            company_id: companyId,
            document_type: "travel_expense_form",
            source: "generated",
            status: "needs_review",
            file_name: fileName,
            file_path: filePath,
            mime_type: "application/pdf",
            file_size: pdfBytes.byteLength,
            generated_by_system: true,
        })
        .select("id")
        .single();

    if (documentError || !document) {
        return {
            success: false,
            message: `Dokument konnte nicht angelegt werden: ${
                documentError?.message ?? "Keine Dokument-ID erhalten"
            }`,
        };
    }

    const { error: updateError } = await supabase
        .from("travel_expense_forms")
        .update({
            document_id: document.id,
        })
        .eq("id", travelFormId)
        .eq("company_id", companyId);

    if (updateError) {
        return {
            success: false,
            message: `Formular wurde erzeugt, aber Dokument konnte nicht verknüpft werden: ${updateError.message}`,
        };
    }

    revalidatePath("/dashboard/travel-expenses");
    revalidatePath("/dashboard/documents");

    redirect(`/dashboard/documents?createdDocument=${document.id}`);
}