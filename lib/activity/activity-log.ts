import "server-only";

import { getCurrentCompanyId } from "@/lib/company";
import { createAuthServerSupabaseClient } from "@/lib/supabase/auth-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LogActivityParams = {
    action: string;
    entityType?: string;
    entityId?: string | null;
};

function getFallbackUserName(email: string | null | undefined): string {
    if (!email) return "Unbekannter Benutzer";

    return email;
}

export async function logActivity({
                                      action,
                                      entityType,
                                      entityId,
                                  }: LogActivityParams): Promise<void> {
    try {
        const authSupabase = await createAuthServerSupabaseClient();
        const dbSupabase = createServerSupabaseClient();
        const companyId = getCurrentCompanyId();

        const {
            data: { user },
        } = await authSupabase.auth.getUser();

        const authUserId = user?.id ?? null;
        const fallbackUserName = getFallbackUserName(user?.email);

        let userName = fallbackUserName;

        if (authUserId) {
            const { data: profile } = await dbSupabase
                .from("profiles")
                .select("first_name, last_name, email")
                .eq("auth_user_id", authUserId)
                .eq("company_id", companyId)
                .maybeSingle();

            if (profile) {
                const fullName = [profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                userName = fullName.length > 0 ? fullName : profile.email;
            }
        }

        const { error } = await dbSupabase.from("activity_logs").insert({
            company_id: companyId,
            auth_user_id: authUserId,
            user_name: userName,
            action,
            entity_type: entityType ?? null,
            entity_id: entityId ?? null,
        });

        if (error) {
            console.error("Activity log konnte nicht gespeichert werden:", error.message);
        }
    } catch (error) {
        console.error("Activity log Fehler:", error);
    }
}