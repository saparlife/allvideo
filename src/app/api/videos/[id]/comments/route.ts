import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const supabase = await createClient();

  // Get current user for like status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    let query = (supabase as any)
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        likes_count,
        parent_id,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `
      )
      .eq("video_id", id)
      .is("parent_id", null); // Only top-level comments

    if (sort === "top") {
      query = query.order("likes_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: comments, error } = await query.limit(50);

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user's likes if logged in
    let userLikes: Set<string> = new Set();
    if (user) {
      const allCommentIds = (comments || []).map((c: any) => c.id);
      const { data: likes } = await (supabase as any)
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", allCommentIds);

      userLikes = new Set((likes || []).map((l: any) => l.comment_id));
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: any) => {
        const { data: replies } = await (supabase as any)
          .from("comments")
          .select(
            `
            id,
            content,
            created_at,
            updated_at,
            likes_count,
            user:user_id (
              id,
              username,
              avatar_url
            )
          `
          )
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true })
          .limit(10);

        // Check likes for replies
        let replyLikes: Set<string> = new Set();
        if (user && replies && replies.length > 0) {
          const replyIds = replies.map((r: any) => r.id);
          const { data: rLikes } = await (supabase as any)
            .from("comment_likes")
            .select("comment_id")
            .eq("user_id", user.id)
            .in("comment_id", replyIds);

          replyLikes = new Set((rLikes || []).map((l: any) => l.comment_id));
        }

        return {
          ...comment,
          is_liked: userLikes.has(comment.id),
          replies: (replies || []).map((reply: any) => ({
            ...reply,
            is_liked: replyLikes.has(reply.id),
          })),
        };
      })
    );

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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
    const { content, parent_id } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment too long" },
        { status: 400 }
      );
    }

    // Insert comment
    const { data: comment, error } = await (supabase as any)
      .from("comments")
      .insert({
        video_id: id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select(
        `
        id,
        content,
        created_at,
        likes_count,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
