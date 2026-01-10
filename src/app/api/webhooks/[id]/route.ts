import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebhookSecret } from "@/lib/webhooks/client";

/**
 * GET /api/webhooks/:id
 * Get webhook details including recent deliveries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: webhook, error } = await db
      .from("webhooks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Get recent deliveries
    const { data: deliveries } = await db
      .from("webhook_deliveries")
      .select("*")
      .eq("webhook_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        is_active: webhook.is_active,
        last_triggered_at: webhook.last_triggered_at,
        failure_count: webhook.failure_count,
        created_at: webhook.created_at,
      },
      deliveries: deliveries || [],
    });
  } catch (error) {
    console.error("Webhook GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/webhooks/:id
 * Update webhook settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check ownership
    const { data: existing, error: findError } = await db
      .from("webhooks")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, url, events, is_active, regenerate_secret } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (url !== undefined) {
      try {
        new URL(url);
        updates.url = url;
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
    }
    if (events !== undefined) {
      const validEvents = ["media.uploaded", "media.processing", "media.ready", "media.failed", "media.deleted"];
      const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(", ")}` }, { status: 400 });
      }
      updates.events = events;
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (regenerate_secret) {
      updates.secret = generateWebhookSecret();
    }

    const { data: webhook, error } = await db
      .from("webhooks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        is_active: webhook.is_active,
        secret: regenerate_secret ? webhook.secret : undefined, // Only return if regenerated
        updated_at: webhook.updated_at,
      },
    });
  } catch (error) {
    console.error("Webhook PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { error } = await db
      .from("webhooks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("Webhook DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
