import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if already liked
    const { data: existing } = await (supabase as any)
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Add like
    const { error } = await (supabase as any).from("likes").insert({
      user_id: user.id,
      video_id: id,
    });

    if (error) {
      console.error("Error adding like:", error);
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
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { error } = await (supabase as any)
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("video_id", id);

    if (error) {
      console.error("Error removing like:", error);
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
