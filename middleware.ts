import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });

                response = NextResponse.next({
                    request,
                });

                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    const isAuthPage =
        pathname === "/login" ||
        pathname === "/register";

    const isDashboardPage = pathname.startsWith("/dashboard");

    if (isDashboardPage && !user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        redirectUrl.searchParams.set("redirectedFrom", pathname);

        return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPage && user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        redirectUrl.search = "";

        return NextResponse.redirect(redirectUrl);
    }

    return response;
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/register",
    ],
};