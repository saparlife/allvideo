import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
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
      .from("comment_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("comment_id", commentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Create like
    const { error: likeError } = await (supabase as any)
      .from("comment_likes")
      .insert({
        user_id: user.id,
        comment_id: commentId,
      });

    if (likeError) {
      console.error("Like error:", likeError);
      return NextResponse.json({ error: likeError.message }, { status: 500 });
    }

    // Get current likes count and increment
    const { data: comment } = await (supabase as any)
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();

    await (supabase as any)
      .from("comments")
      .update({ likes_count: (comment?.likes_count || 0) + 1 })
      .eq("id", commentId);

    return NextResponse.json({ success: true, liked: true, likes_count: (comment?.likes_count || 0) + 1 });
  } catch (error) {
    console.error("Like comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete like
    const { error: deleteError } = await (supabase as any)
      .from("comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);

    if (deleteError) {
      console.error("Unlike error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Get current likes count and decrement
    const { data: comment } = await (supabase as any)
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();

    const newCount = Math.max(0, (comment?.likes_count || 0) - 1);
    await (supabase as any)
      .from("comments")
      .update({ likes_count: newCount })
      .eq("id", commentId);

    return NextResponse.json({ success: true, liked: false, likes_count: newCount });
  } catch (error) {
    console.error("Unlike comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ liked: false });
  }

  const { data } = await (supabase as any)
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  return NextResponse.json({ liked: !!data });
}
