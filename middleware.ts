import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseFetch } from "@/lib/supabase/fetch";

// Refreshes the Supabase session cookie on every request, and finishes the
// email-confirmation (PKCE) sign-in when a ?code= link lands on any page.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    global: { fetch: createSupabaseFetch(key) },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    const url = request.nextUrl.clone();
    url.searchParams.delete("code");
    if (!error) url.pathname = "/app";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
