import { unstable_noStore as noStore } from "next/cache";

import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CompanySettings = {
    id: string;
    legal_name: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    email: string | null;
    phone: string | null;
    vat_id: string | null;
    tax_number: string | null;
    commercial_register_number: string | null;
    signature_image_path: string | null;
    stamp_image_path: string | null;
};

export async function getCompanySettings(): Promise<CompanySettings> {
    noStore();

    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("companies")
        .select(
            `
            id,
            legal_name,
            street,
            postal_code,
            city,
            country,
            email,
            phone,
            vat_id,
            tax_number,
            commercial_register_number,
            signature_image_path,
            stamp_image_path
        `,
        )
        .eq("id", companyId)
        .single();

    if (error || !data) {
        throw new Error(
            `Firmendaten konnten nicht geladen werden: ${
                error?.message ?? "Nicht gefunden"
            }`,
        );
    }

    return data as CompanySettings;
}
