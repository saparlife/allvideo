import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playlist, error } = await (supabase as any)
    .from("playlists")
    .select(`
      id,
      title,
      description,
      visibility,
      created_at,
      updated_at,
      user_id,
      user:users!playlists_user_id_fkey (
        id,
        username,
        avatar_url
      ),
      playlist_videos:playlist_videos (
        id,
        position,
        added_at,
        video:videos (
          id,
          title,
          slug,
          thumbnail_url,
          duration,
          views_count,
          created_at,
          user:users!videos_user_id_fkey (
            id,
            username,
            avatar_url
          )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Check visibility
  if (playlist.visibility !== "public" && playlist.user_id !== user?.id) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Sort videos by position
  const videos = (playlist.playlist_videos || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((pv: any) => ({
      ...pv.video,
      playlist_video_id: pv.id,
      added_at: pv.added_at,
    }));

  return NextResponse.json({
    playlist: {
      ...playlist,
      videos,
      videoCount: videos.length,
      playlist_videos: undefined,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Props) {
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
    const { title, description, visibility } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (visibility !== undefined) updates.visibility = visibility;
    updates.updated_at = new Date().toISOString();

    const { data: playlist, error } = await (supabase as any)
      .from("playlists")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ playlist });
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

  const { error } = await (supabase as any)
    .from("playlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
