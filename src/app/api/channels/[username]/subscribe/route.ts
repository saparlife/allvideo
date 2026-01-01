import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ username: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get channel by username
    const { data: channel } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Can't subscribe to yourself
    if (channel.id === user.id) {
      return NextResponse.json(
        { error: "Cannot subscribe to yourself" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await (supabase as any)
      .from("channel_subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("channel_id", channel.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed" },
        { status: 400 }
      );
    }

    // Add subscription
    const { error } = await (supabase as any)
      .from("channel_subscriptions")
      .insert({
        subscriber_id: user.id,
        channel_id: channel.id,
      });

    if (error) {
      console.error("Error subscribing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get channel by username
    const { data: channel } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Remove subscription
    const { error } = await (supabase as any)
      .from("channel_subscriptions")
      .delete()
      .eq("subscriber_id", user.id)
      .eq("channel_id", channel.id);

    if (error) {
      console.error("Error unsubscribing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
