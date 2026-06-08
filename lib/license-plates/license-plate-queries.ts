import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LicensePlateType = "export" | "customs" | "short_term";
export type LicensePlateStatus = "open" | "requested" | "completed" | "cancelled";

export type LicensePlateCaseRow = {
    id: string;

    vehicle_id: string | null;
    customer_id: string | null;
    sale_id: string | null;

    plate_type: LicensePlateType;
    duration_days: number | null;
    status: LicensePlateStatus;

    requested_at: string;
    valid_from: string | null;
    valid_until: string | null;

    license_plate_number: string | null;
    registration_office: string | null;
    notes: string | null;

    created_at: string;

    customer_name: string | null;
    vehicle_internal_number: string | null;
    vehicle_name: string | null;
    vin: string | null;
};

type LicensePlateCaseQueryRow = {
    id: string;

    vehicle_id: string | null;
    customer_id: string | null;
    sale_id: string | null;

    plate_type: LicensePlateType;
    duration_days: number | null;
    status: LicensePlateStatus;

    requested_at: string;
    valid_from: string | null;
    valid_until: string | null;

    license_plate_number: string | null;
    registration_office: string | null;
    notes: string | null;

    created_at: string;

    customers: {
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
    } | null;

    vehicles: {
        internal_number: string;
        manufacturer: string;
        model: string;
        vin: string;
    } | null;
};

function getCustomerName(
    customer: LicensePlateCaseQueryRow["customers"],
): string | null {
    if (!customer) return null;

    if (customer.type === "company") {
        return customer.company_name ?? "Unbekannte Firma";
    }

    const privateName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    return privateName.length > 0 ? privateName : "Unbekannte Privatperson";
}

export async function getLicensePlateCases(): Promise<LicensePlateCaseRow[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("license_plate_cases")
        .select(
            `
      id,
      vehicle_id,
      customer_id,
      sale_id,
      plate_type,
      duration_days,
      status,
      requested_at,
      valid_from,
      valid_until,
      license_plate_number,
      registration_office,
      notes,
      created_at,
      customers (
        type,
        company_name,
        first_name,
        last_name
      ),
      vehicles (
        internal_number,
        manufacturer,
        model,
        vin
      )
    `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(
            `Kennzeichen-Vorgänge konnten nicht geladen werden: ${error.message}`,
        );
    }

    return ((data ?? []) as unknown as LicensePlateCaseQueryRow[]).map((item) => {
        const vehicle = item.vehicles;

        return {
            id: item.id,

            vehicle_id: item.vehicle_id,
            customer_id: item.customer_id,
            sale_id: item.sale_id,

            plate_type: item.plate_type,
            duration_days: item.duration_days,
            status: item.status,

            requested_at: item.requested_at,
            valid_from: item.valid_from,
            valid_until: item.valid_until,

            license_plate_number: item.license_plate_number,
            registration_office: item.registration_office,
            notes: item.notes,

            created_at: item.created_at,

            customer_name: getCustomerName(item.customers),
            vehicle_internal_number: vehicle?.internal_number ?? null,
            vehicle_name: vehicle
                ? `${vehicle.manufacturer} ${vehicle.model}`
                : null,
            vin: vehicle?.vin ?? null,
        };
    });
}