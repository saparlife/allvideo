import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminDb = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = adminDb as any;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, uploadId, parts } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing videoId" },
        { status: 400 }
      );
    }

    // Verify video belongs to user
    const { data: video, error: videoError } = await db
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Complete multipart upload if uploadId and parts are provided
    if (uploadId && parts && Array.isArray(parts)) {
      console.log("Completing multipart upload", { uploadId, partsCount: parts.length });

      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET,
        Key: video.original_key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part: { partNumber: number; etag: string }) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        },
      });

      await r2Client.send(completeCommand);
      console.log("Multipart upload completed successfully");
    }

    // Update video status to processing
    const { error: updateError } = await db
      .from("videos")
      .update({
        status: "processing",
      })
      .eq("id", videoId);

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json(
        { error: "Failed to update video status" },
        { status: 500 }
      );
    }

    // Update user storage used
    await db.rpc("increment_storage", {
      user_id_param: user.id,
      bytes_param: video.original_size_bytes,
    });

    // Create transcode job
    const { error: jobError } = await db
      .from("transcode_jobs")
      .insert({
        video_id: videoId,
        status: "pending",
        priority: 0,
      });

    if (jobError) {
      console.error("Error creating transcode job:", jobError);
      // Don't fail the request, video is uploaded
    }

    return NextResponse.json({
      success: true,
      videoId,
      message: "Video uploaded, processing will begin shortly",
    });
  } catch (error) {
    console.error("Upload complete error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
