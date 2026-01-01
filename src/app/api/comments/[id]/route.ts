import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: comment, error } = await (supabase as any)
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      updated_at,
      video_id,
      parent_id,
      user:users!comments_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq("id", id)
    .single();

  if (error || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ comment });
}

export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    // Check ownership
    const { data: existingComment } = await (supabase as any)
      .from("comments")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: comment, error } = await (supabase as any)
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        video_id,
        parent_id,
        user:users!comments_user_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch {
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

  // Check ownership or if user owns the video the comment is on
  const { data: comment } = await (supabase as any)
    .from("comments")
    .select(`
      id,
      user_id,
      video:videos!comments_video_id_fkey (
        id,
        user_id
      )
    `)
    .eq("id", id)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isCommentOwner = comment.user_id === user.id;
  const isVideoOwner = comment.video?.user_id === user.id;

  if (!isCommentOwner && !isVideoOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete the comment (and its replies due to cascade)
  const { error } = await (supabase as any)
    .from("comments")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
