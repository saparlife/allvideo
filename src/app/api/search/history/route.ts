import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get user's search history
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ history: [] });
  }

  const { data: history } = await (supabase as any)
    .from("search_history")
    .select("query, searched_at")
    .eq("user_id", user.id)
    .order("searched_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ history: history || [] });
}

// POST - Save a search query
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    // Upsert to update searched_at if query exists
    await (supabase as any)
      .from("search_history")
      .upsert(
        {
          user_id: user.id,
          query: query.trim().toLowerCase(),
          searched_at: new Date().toISOString(),
        },
        { onConflict: "user_id,query" }
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Clear search history
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (query) {
    // Delete specific query
    await (supabase as any)
      .from("search_history")
      .delete()
      .eq("user_id", user.id)
      .eq("query", query);
  } else {
    // Delete all history
    await (supabase as any)
      .from("search_history")
      .delete()
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
