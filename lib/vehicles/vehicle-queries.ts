import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/company";

export type VehicleStatus = "in_stock" | "reserved" | "sold";
export type VehicleDocumentStatus = "complete" | "partial" | "missing";

export type VehicleRow = {
    id: string;
    internal_number: string;
    manufacturer: string;
    model: string;
    vehicle_type: string;
    construction_year: number | null;
    first_registration: string | null;
    vin: string;
    license_plate: string | null;
    purchase_price_net: number;
    sale_price_net: number | null;
    additional_costs_net: number;
    status: VehicleStatus;
    notes: string | null;
    created_at: string;
    seller_name: string | null;
    buyer_name: string | null;
    document_status: VehicleDocumentStatus;
};

export async function getVehicles(): Promise<VehicleRow[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("vehicles")
        .select(
            `
      id,
      internal_number,
      manufacturer,
      model,
      vehicle_type,
      construction_year,
      first_registration,
      vin,
      license_plate,
      purchase_price_net,
      sale_price_net,
      additional_costs_net,
      status,
      notes,
      created_at
    `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Fahrzeuge konnten nicht geladen werden: ${error.message}`);
    }

    return (data ?? []).map((vehicle) => ({
        ...vehicle,
        seller_name: null,
        buyer_name: null,
        document_status: "partial",
    }));
}

export async function getSellableVehicles(): Promise<VehicleRow[]> {
    const vehicles = await getVehicles();

    return vehicles.filter(
        (vehicle) => vehicle.status === "in_stock" || vehicle.status === "reserved",
    );
}