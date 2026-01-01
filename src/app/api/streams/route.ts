import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateStreamKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "live_";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, category_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique stream key
    const stream_key = generateStreamKey();

    const { data: stream, error } = await (supabase as any)
      .from("streams")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category_id: category_id || null,
        stream_key,
        status: "offline",
      })
      .select()
      .single();

    if (error) {
      console.error("Stream creation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("Stream API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: streams, error } = await (supabase as any)
    .from("streams")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ streams: streams || [] });
}
