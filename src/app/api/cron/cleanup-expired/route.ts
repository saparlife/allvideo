import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Create admin Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// R2 client for deleting videos
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    let processedUsers = 0;
    let deletedVideos = 0;

    // Find all subscriptions with expired grace period
    // (is_active = false AND expires_at < now)
    const { data: expiredSubscriptions, error: subError } = await (supabaseAdmin as any)
      .from("subscriptions")
      .select("user_id")
      .eq("is_active", false)
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (subError) {
      console.error("Error fetching expired subscriptions:", subError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No expired subscriptions to process",
        processedUsers: 0,
        deletedVideos: 0,
      });
    }

    // Process each user with expired subscription
    for (const sub of expiredSubscriptions) {
      const userId = sub.user_id;

      // Check if user is already on free tier (already processed)
      const { data: existingFreeSub } = await (supabaseAdmin as any)
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("tier", "free")
        .eq("is_active", true)
        .single();

      if (existingFreeSub) {
        // Already processed, skip
        continue;
      }

      console.log(`Processing expired subscription for user: ${userId}`);

      // Get all videos for this user
      const { data: videos, error: videosError } = await (supabaseAdmin as any)
        .from("videos")
        .select("id, original_key, hls_key, thumbnail_key")
        .eq("user_id", userId);

      if (videosError) {
        console.error(`Error fetching videos for user ${userId}:`, videosError);
        continue;
      }

      // Delete videos from R2
      if (videos && videos.length > 0) {
        for (const video of videos) {
          try {
            // Delete all objects with the user/video prefix
            const prefix = `${userId}/${video.id}/`;
            await deleteR2Prefix(prefix);
            deletedVideos++;
          } catch (err) {
            console.error(`Error deleting video ${video.id} from R2:`, err);
          }
        }

        // Delete video records from database
        const { error: deleteError } = await (supabaseAdmin as any)
          .from("videos")
          .delete()
          .eq("user_id", userId);

        if (deleteError) {
          console.error(`Error deleting video records for user ${userId}:`, deleteError);
        }
      }

      // Reset user to free tier limits
      await (supabaseAdmin as any)
        .from("users")
        .update({
          storage_limit_bytes: 10 * 1024 * 1024 * 1024, // 10GB free
          bandwidth_limit_bytes: 100 * 1024 * 1024 * 1024, // 100GB free
          storage_used_bytes: 0,
          updated_at: now,
        })
        .eq("id", userId);

      // Delete the expired subscription record
      await (supabaseAdmin as any)
        .from("subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("is_active", false);

      // Create new free subscription
      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        tier: "free",
        storage_limit_gb: 10,
        bandwidth_limit_gb: 100,
        is_active: true,
        starts_at: now,
      });

      processedUsers++;
      console.log(`User ${userId} downgraded to free, ${videos?.length || 0} videos deleted`);
    }

    return NextResponse.json({
      message: "Cleanup completed",
      processedUsers,
      deletedVideos,
    });
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to delete all objects with a given prefix from R2
async function deleteR2Prefix(prefix: string): Promise<void> {
  // List all objects with the prefix
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  });

  const listResponse = await r2Client.send(listCommand);

  if (!listResponse.Contents || listResponse.Contents.length === 0) {
    return;
  }

  // Delete all objects
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: {
      Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
    },
  });

  await r2Client.send(deleteCommand);

  // If there are more objects (pagination), continue deleting
  if (listResponse.IsTruncated) {
    await deleteR2Prefix(prefix);
  }
}
