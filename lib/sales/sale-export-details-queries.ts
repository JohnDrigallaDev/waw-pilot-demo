import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SaleExportDetails = {
    sale_id: string;
    export_destination_city: string | null;
    export_destination_country: string | null;
    export_arrival_month: string | null;
    export_arrival_year: string | null;
    export_transport_date: string | null;
    export_transport_type: string | null;
    export_receiver_name: string | null;
};

export async function getSaleExportDetails(
    saleId: string,
): Promise<SaleExportDetails> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("sales")
        .select(
            `
            id,
            export_destination_city,
            export_destination_country,
            export_arrival_month,
            export_arrival_year,
            export_transport_date,
            export_transport_type,
            export_receiver_name
        `,
        )
        .eq("id", saleId)
        .eq("company_id", companyId)
        .single();

    if (error || !data) {
        throw new Error(
            `Exportdaten konnten nicht geladen werden: ${
                error?.message ?? "Nicht gefunden"
            }`,
        );
    }

    return {
        sale_id: data.id as string,
        export_destination_city: data.export_destination_city,
        export_destination_country: data.export_destination_country,
        export_arrival_month: data.export_arrival_month,
        export_arrival_year: data.export_arrival_year,
        export_transport_date: data.export_transport_date,
        export_transport_type: data.export_transport_type,
        export_receiver_name: data.export_receiver_name,
    };
}