import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await (supabase as any)
    .from("users")
    .select("id, email, username, bio, website, social_links, avatar_url, banner_url, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, bio, website, social_links, avatar_url, banner_url } = body;

    // Validate username if provided
    if (username !== undefined) {
      if (typeof username !== "string" || username.length < 3 || username.length > 30) {
        return NextResponse.json(
          { error: "Username must be between 3 and 30 characters" },
          { status: 400 }
        );
      }

      // Check if username is taken
      const { data: existing } = await (supabase as any)
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {};
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (social_links !== undefined) updates.social_links = social_links;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (banner_url !== undefined) updates.banner_url = banner_url;

    const { data: profile, error } = await (supabase as any)
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select("id, email, username, bio, website, social_links, avatar_url, banner_url, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
