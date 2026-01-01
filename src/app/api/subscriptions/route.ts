import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscriptions, error } = await (supabase as any)
    .from("channel_subscriptions")
    .select(`
      id,
      channel_id,
      created_at,
      notifications,
      channel:channel_id (
        id,
        username,
        avatar_url,
        subscribers_count
      )
    `)
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: subscriptions || [] });
}
