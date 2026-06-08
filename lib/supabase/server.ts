import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt.");
    }

    if (!supabaseAnonKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.");
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}