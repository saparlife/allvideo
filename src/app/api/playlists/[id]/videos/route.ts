import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id: playlistId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Check playlist ownership
    const { data: playlist } = await (supabase as any)
      .from("playlists")
      .select("id, user_id")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Check if video is already in playlist
    const { data: existing } = await (supabase as any)
      .from("playlist_videos")
      .select("id")
      .eq("playlist_id", playlistId)
      .eq("video_id", videoId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Video is already in this playlist" },
        { status: 400 }
      );
    }

    // Get max position
    const { data: maxPos } = await (supabase as any)
      .from("playlist_videos")
      .select("position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPos?.position || 0) + 1;

    // Add video to playlist
    const { data: playlistVideo, error } = await (supabase as any)
      .from("playlist_videos")
      .insert({
        playlist_id: playlistId,
        video_id: videoId,
        position: newPosition,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update playlist updated_at
    await (supabase as any)
      .from("playlists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", playlistId);

    return NextResponse.json({ playlistVideo }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { id: playlistId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { videoId, playlistVideoId } = body;

    // Check playlist ownership
    const { data: playlist } = await (supabase as any)
      .from("playlists")
      .select("id, user_id")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    let deleteQuery = (supabase as any)
      .from("playlist_videos")
      .delete()
      .eq("playlist_id", playlistId);

    if (playlistVideoId) {
      deleteQuery = deleteQuery.eq("id", playlistVideoId);
    } else if (videoId) {
      deleteQuery = deleteQuery.eq("video_id", videoId);
    } else {
      return NextResponse.json(
        { error: "Video ID or playlist video ID is required" },
        { status: 400 }
      );
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update playlist updated_at
    await (supabase as any)
      .from("playlists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", playlistId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Reorder videos in playlist
export async function PATCH(request: NextRequest, { params }: Props) {
  const { id: playlistId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { order } = body; // Array of { id: playlistVideoId, position: number }

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: "Order array is required" },
        { status: 400 }
      );
    }

    // Check playlist ownership
    const { data: playlist } = await (supabase as any)
      .from("playlists")
      .select("id, user_id")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Update positions
    for (const item of order) {
      await (supabase as any)
        .from("playlist_videos")
        .update({ position: item.position })
        .eq("id", item.id)
        .eq("playlist_id", playlistId);
    }

    // Update playlist updated_at
    await (supabase as any)
      .from("playlists")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", playlistId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
