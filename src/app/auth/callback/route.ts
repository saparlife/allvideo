import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/studio";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a username set
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingUser } = await (supabase as any)
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        // If no username, redirect to setup page
        if (!existingUser?.username) {
          return NextResponse.redirect(`${origin}/setup`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
