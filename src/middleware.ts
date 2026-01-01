import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "never",
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip i18n for API routes and embed pages
  if (pathname.startsWith("/api") || pathname.startsWith("/embed")) {
    return await updateSession(request);
  }

  // Apply intl middleware for locale handling
  const intlResponse = intlMiddleware(request);

  // If intl middleware returns a redirect, use it
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // Update Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
