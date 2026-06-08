import { notFound } from "next/navigation";

import { getCurrentCompanyId } from "@/lib/company";
import type {
    LicensePlateStatus,
    LicensePlateType,
} from "@/lib/license-plates/license-plate-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseRelation<T> = T | T[] | null;

type LicensePlateCaseDetailQueryRow = {
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

    customers: SupabaseRelation<{
        type: "company" | "private";
        company_name: string | null;
        first_name: string | null;
        last_name: string | null;
        street: string | null;
        postal_code: string | null;
        city: string | null;
        country: string | null;
        email: string | null;
        phone: string | null;
    }>;

    vehicles: SupabaseRelation<{
        internal_number: string;
        manufacturer: string;
        model: string;
        vehicle_type: string;
        vin: string;
        license_plate: string | null;
        first_registration: string | null;
        construction_year: number | null;
    }>;

    sales: SupabaseRelation<{
        sale_date: string;
        gross_amount: number | string;
        payment_status: string;
    }>;
};

type LicensePlateDocumentQueryRow = {
    id: string;
    document_type: string;
    source: string;
    status: "available" | "missing" | "needs_review";
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    created_at: string;
};

export type LicensePlateCaseDocument = {
    id: string;
    document_type: string;
    source: string;
    status: "available" | "missing" | "needs_review";
    file_name: string;
    file_path: string | null;
    mime_type: string | null;
    file_size: number | null;
    created_at: string;
};

export type LicensePlateCaseDetail = {
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

    customer: {
        name: string;
        address: string;
        email: string | null;
        phone: string | null;
    } | null;

    vehicle: {
        internal_number: string;
        name: string;
        vehicle_type: string;
        vin: string;
        license_plate: string | null;
        first_registration: string | null;
        construction_year: number | null;
    } | null;

    sale: {
        sale_date: string;
        gross_amount: number;
        payment_status: string;
    } | null;

    documents: LicensePlateCaseDocument[];
};

function getSingleRelation<T>(relation: SupabaseRelation<T>): T | null {
    if (!relation) return null;

    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation;
}

function getCustomerName(
    customer: LicensePlateCaseDetailQueryRow["customers"] extends SupabaseRelation<infer T>
        ? T
        : never,
): string {
    if (customer.type === "company") {
        return customer.company_name ?? "Unbekannte Firma";
    }

    const privateName = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    return privateName.length > 0 ? privateName : "Unbekannte Privatperson";
}

export async function getLicensePlateCaseDetail(
    plateCaseId: string,
): Promise<LicensePlateCaseDetail> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const [{ data, error }, { data: documentsData, error: documentsError }] =
        await Promise.all([
            supabase
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
        last_name,
        street,
        postal_code,
        city,
        country,
        email,
        phone
      ),
      vehicles (
        internal_number,
        manufacturer,
        model,
        vehicle_type,
        vin,
        license_plate,
        first_registration,
        construction_year
      ),
      sales (
        sale_date,
        gross_amount,
        payment_status
      )
    `,
                )
                .eq("id", plateCaseId)
                .eq("company_id", companyId)
                .single(),

            supabase
                .from("documents")
                .select(
                    `
      id,
      document_type,
      source,
      status,
      file_name,
      file_path,
      mime_type,
      file_size,
      created_at
    `,
                )
                .eq("company_id", companyId)
                .eq("license_plate_case_id", plateCaseId)
                .order("created_at", { ascending: false }),
        ]);

    if (error || !data) {
        notFound();
    }

    if (documentsError) {
        throw new Error(
            `Kennzeichen-Dokumente konnten nicht geladen werden: ${documentsError.message}`,
        );
    }

    const item = data as unknown as LicensePlateCaseDetailQueryRow;

    const customer = getSingleRelation(item.customers);
    const vehicle = getSingleRelation(item.vehicles);
    const sale = getSingleRelation(item.sales);

    const documents = ((documentsData ?? []) as LicensePlateDocumentQueryRow[]).map(
        (document) => ({
            id: document.id,
            document_type: document.document_type,
            source: document.source,
            status: document.status,
            file_name: document.file_name,
            file_path: document.file_path,
            mime_type: document.mime_type,
            file_size: document.file_size,
            created_at: document.created_at,
        }),
    );

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

        customer: customer
            ? {
                name: getCustomerName(customer),
                address: [
                    customer.street,
                    [customer.postal_code, customer.city]
                        .filter(Boolean)
                        .join(" "),
                    customer.country,
                ]
                    .filter(Boolean)
                    .join(", "),
                email: customer.email,
                phone: customer.phone,
            }
            : null,

        vehicle: vehicle
            ? {
                internal_number: vehicle.internal_number,
                name: `${vehicle.manufacturer} ${vehicle.model}`,
                vehicle_type: vehicle.vehicle_type,
                vin: vehicle.vin,
                license_plate: vehicle.license_plate,
                first_registration: vehicle.first_registration,
                construction_year: vehicle.construction_year,
            }
            : null,

        sale: sale
            ? {
                sale_date: sale.sale_date,
                gross_amount: Number(sale.gross_amount),
                payment_status: sale.payment_status,
            }
            : null,

        documents,
    };
}