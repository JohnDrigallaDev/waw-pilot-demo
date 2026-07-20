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
    damage_notes: string | null;
    show_damage_on_invoice: boolean | null;
    created_at: string;
    seller_name: string | null;
    buyer_name: string | null;
    document_status: VehicleDocumentStatus;
};

type VehicleDocumentRow = {
    vehicle_id: string | null;
    status: "available" | "missing" | "needs_review";
};

function getVehicleDocumentStatus(availableDocumentCount: number): VehicleDocumentStatus {
    if (availableDocumentCount >= 2) return "complete";
    if (availableDocumentCount === 1) return "partial";

    return "missing";
}

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
      damage_notes,
      show_damage_on_invoice,
      created_at
    `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Fahrzeuge konnten nicht geladen werden: ${error.message}`);
    }

    const vehicles = data ?? [];
    const vehicleIds = vehicles.map((vehicle) => vehicle.id);
    const availableDocumentsByVehicleId = new Map<string, number>();

    if (vehicleIds.length > 0) {
        const { data: documentsData, error: documentsError } = await supabase
            .from("documents")
            .select("vehicle_id, status")
            .eq("company_id", companyId)
            .in("vehicle_id", vehicleIds);

        if (documentsError) {
            throw new Error(
                `Fahrzeugdokumente konnten nicht geladen werden: ${documentsError.message}`,
            );
        }

        for (const document of (documentsData ?? []) as VehicleDocumentRow[]) {
            if (!document.vehicle_id || document.status !== "available") continue;

            availableDocumentsByVehicleId.set(
                document.vehicle_id,
                (availableDocumentsByVehicleId.get(document.vehicle_id) ?? 0) + 1,
            );
        }
    }

    return vehicles.map((vehicle) => ({
        ...vehicle,
        seller_name: null,
        buyer_name: null,
        document_status: getVehicleDocumentStatus(
            availableDocumentsByVehicleId.get(vehicle.id) ?? 0,
        ),
    }));
}

export async function getSellableVehicles(): Promise<VehicleRow[]> {
    const vehicles = await getVehicles();

    return vehicles.filter(
        (vehicle) => vehicle.status === "in_stock" || vehicle.status === "reserved",
    );
}
