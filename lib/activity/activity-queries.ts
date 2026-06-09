import { getCurrentCompanyId } from "@/lib/company";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActivityLogRow = {
    id: string;
    created_at: string;
    user_name: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
};

export async function getActivityLogs(): Promise<ActivityLogRow[]> {
    const supabase = createServerSupabaseClient();
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from("activity_logs")
        .select("id, created_at, user_name, action, entity_type, entity_id")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);

    if (error) {
        throw new Error(`Aktivitäten konnten nicht geladen werden: ${error.message}`);
    }

    return data ?? [];
}