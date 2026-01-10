import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebhookSecret } from "@/lib/webhooks/client";

/**
 * GET /api/webhooks
 * List all webhooks for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhooks, error } = await (supabase as any)
      .from("webhooks")
      .select("id, name, url, events, is_active, last_triggered_at, failure_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
    }

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Webhooks GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, events } = body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Validate events
    const validEvents = ["media.uploaded", "media.processing", "media.ready", "media.failed", "media.deleted"];
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(", ")}` }, { status: 400 });
    }

    const secret = generateWebhookSecret();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: webhook, error } = await (supabase as any)
      .from("webhooks")
      .insert({
        user_id: user.id,
        name,
        url,
        secret,
        events,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        secret: webhook.secret, // Only returned on creation
        events: webhook.events,
        is_active: webhook.is_active,
        created_at: webhook.created_at,
      },
    });
  } catch (error) {
    console.error("Webhooks POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
