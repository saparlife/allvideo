import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Remove locale prefix for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ru)/, "") || "/";

  const isAuthPage =
    pathnameWithoutLocale.startsWith("/login") ||
    pathnameWithoutLocale.startsWith("/register") ||
    pathnameWithoutLocale.startsWith("/forgot-password") ||
    pathnameWithoutLocale.startsWith("/setup");

  const isPublicPage =
    pathnameWithoutLocale === "/" ||
    pathnameWithoutLocale.startsWith("/pricing") ||
    pathnameWithoutLocale.startsWith("/docs") ||
    pathnameWithoutLocale.startsWith("/embed") ||
    pathnameWithoutLocale.startsWith("/watch") ||
    pathnameWithoutLocale.startsWith("/channel") ||
    pathnameWithoutLocale.startsWith("/search") ||
    pathname.startsWith("/api/public");

  // Redirect unauthenticated users to login
  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/studio";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
