import { redirect } from "next/navigation";

import { createAuthServerSupabaseClient } from "@/lib/supabase/auth-server";

export async function GET() {
    const supabase = await createAuthServerSupabaseClient();

    await supabase.auth.signOut();

    redirect("/login");
}