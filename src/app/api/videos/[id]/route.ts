import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import type { Video } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ video: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { title, description, visibility, tags, category_id, scheduled_at } = body;

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (visibility !== undefined) updates.visibility = visibility;
    if (tags !== undefined) updates.tags = tags;
    if (category_id !== undefined) updates.category_id = category_id;
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;

    const { data, error } = await (supabase as any)
      .from("videos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: data });
  } catch (error) {
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
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get video and verify ownership
  const { data, error: fetchError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !data) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const video = data as Video;

  try {
    const keysToDelete: string[] = [];

    // 1. Add original file to delete list
    if (video.original_key) {
      keysToDelete.push(video.original_key);
    }

    // 2. List and delete all HLS files (includes poster, segments, playlists)
    const hlsPrefix = `users/${user.id}/hls/${id}/`;

    let continuationToken: string | undefined;
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: hlsPrefix,
        ContinuationToken: continuationToken,
      });

      const listResult = await r2Client.send(listCommand);

      if (listResult.Contents) {
        for (const obj of listResult.Contents) {
          if (obj.Key) {
            keysToDelete.push(obj.Key);
          }
        }
      }

      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);

    // 3. Delete all files from R2
    if (keysToDelete.length > 0) {
      // R2/S3 DeleteObjects supports max 1000 keys per request
      const batchSize = 1000;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        });

        await r2Client.send(deleteCommand);
      }
    }

    // 4. Delete from database (videos table - cascade will handle transcode_jobs)
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete video from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedFiles: keysToDelete.length,
    });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
