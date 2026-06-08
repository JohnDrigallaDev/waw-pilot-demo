import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PurchaseFormVehicle = {
    id: string;
    label: string;
};

export type PurchaseFormSeller = {
    id: string;
    label: string;
};

export type PurchaseFormData = {
    vehicles: PurchaseFormVehicle[];
    sellers: PurchaseFormSeller[];
};

type VehicleRow = {
    id: string;
    internal_number: string;
    manufacturer: string;
    model: string;
    vin: string;
};

type CustomerRow = {
    id: string;
    type: "company" | "private";
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
};

function getCustomerName(customer: CustomerRow): string {
    if (customer.type === "company") {
        return customer.company_name ?? "Unbekannte Firma";
    }

    const privateName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    return privateName.length > 0 ? privateName : "Unbekannte Privatperson";
}

export async function getPurchaseFormData(): Promise<PurchaseFormData> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const [
        { data: vehiclesData, error: vehiclesError },
        { data: customersData, error: customersError },
    ] = await Promise.all([
        supabase
            .from("vehicles")
            .select("id, internal_number, manufacturer, model, vin")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),

        supabase
            .from("customers")
            .select("id, type, company_name, first_name, last_name")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false }),
    ]);

    if (vehiclesError) {
        throw new Error(`Fahrzeuge konnten nicht geladen werden: ${vehiclesError.message}`);
    }

    if (customersError) {
        throw new Error(`Verkäufer/Kunden konnten nicht geladen werden: ${customersError.message}`);
    }

    return {
        vehicles: ((vehiclesData ?? []) as VehicleRow[]).map((vehicle) => ({
            id: vehicle.id,
            label: `${vehicle.internal_number} · ${vehicle.manufacturer} ${vehicle.model} · ${vehicle.vin}`,
        })),

        sellers: ((customersData ?? []) as CustomerRow[]).map((seller) => ({
            id: seller.id,
            label: getCustomerName(seller),
        })),
    };
}