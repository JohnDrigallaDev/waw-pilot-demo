import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createAuthServerSupabaseClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL fehlt.");
    }

    if (!supabaseAnonKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.");
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Wird ignoriert, falls setAll in einem Server Component Context läuft.
                    // In Server Actions und Route Handlers funktioniert es.
                }
            },
        },
    });
}