import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const username = searchParams.get("username");

  // If no filters, get current user's playlists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = (supabase as any)
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
        video:videos (
          id,
          thumbnail_url
        )
      )
    `)
    .order("updated_at", { ascending: false });

  if (username) {
    // Get playlists by username - only public
    const { data: channelUser } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!channelUser) {
      return NextResponse.json({ playlists: [] });
    }

    query = query.eq("user_id", channelUser.id).eq("visibility", "public");
  } else if (userId) {
    // Get playlists by user_id
    if (user && user.id === userId) {
      // Own playlists - include all
      query = query.eq("user_id", userId);
    } else {
      // Other user - only public
      query = query.eq("user_id", userId).eq("visibility", "public");
    }
  } else if (user) {
    // Current user's playlists
    query = query.eq("user_id", user.id);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: playlists, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add video count and first 4 thumbnails
  const formattedPlaylists = (playlists || []).map((playlist: any) => ({
    ...playlist,
    videoCount: playlist.playlist_videos?.length || 0,
    thumbnails: playlist.playlist_videos
      ?.slice(0, 4)
      .map((pv: any) => pv.video?.thumbnail_url)
      .filter(Boolean),
    playlist_videos: undefined,
  }));

  return NextResponse.json({ playlists: formattedPlaylists });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, visibility = "public" } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Playlist title is required" },
        { status: 400 }
      );
    }

    const { data: playlist, error } = await (supabase as any)
      .from("playlists")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        visibility,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ playlist }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
