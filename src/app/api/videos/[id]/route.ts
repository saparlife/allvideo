import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import {
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

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
  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

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
