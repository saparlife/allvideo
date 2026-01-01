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

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = (supabase as any)
    .from("notifications")
    .select(`
      id,
      type,
      title,
      message,
      data,
      is_read,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unread count
  const { count: unreadCount } = await (supabase as any)
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return NextResponse.json({
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
  });
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
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all as read
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .in("id", notificationIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
