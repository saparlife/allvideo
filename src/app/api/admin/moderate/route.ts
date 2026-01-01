import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { report_id, content_type, content_id, action } = body;

    let actionTaken = "";
    let message = "";

    switch (action) {
      case "dismiss":
        // Just mark report as dismissed
        await (supabase as any)
          .from("content_reports")
          .update({
            status: "dismissed",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: "Report dismissed - no action needed",
          })
          .eq("id", report_id);
        actionTaken = "dismissed";
        message = "Report dismissed";
        break;

      case "reviewed":
        // Mark as reviewed but no action taken
        await (supabase as any)
          .from("content_reports")
          .update({
            status: "reviewed",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: "Reviewed - monitoring",
          })
          .eq("id", report_id);
        actionTaken = "reviewed";
        message = "Report marked as reviewed";
        break;

      case "remove_video":
        if (content_type !== "video") {
          return NextResponse.json({ error: "Invalid content type for this action" }, { status: 400 });
        }

        // Remove video (soft delete)
        await (supabase as any)
          .from("videos")
          .update({
            is_removed: true,
            removed_at: new Date().toISOString(),
            removed_reason: "Removed due to content policy violation",
            removed_by: user.id,
            visibility: "private",
          })
          .eq("id", content_id);

        // Update report
        await (supabase as any)
          .from("content_reports")
          .update({
            status: "action_taken",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: "Video removed",
          })
          .eq("id", report_id);

        // Log admin action
        await (supabase as any).from("admin_actions").insert({
          admin_id: user.id,
          action_type: "remove_video",
          target_type: "video",
          target_id: content_id,
          reason: "Content policy violation",
        });

        actionTaken = "remove_video";
        message = "Video has been removed";
        break;

      case "hide_comment":
        if (content_type !== "comment") {
          return NextResponse.json({ error: "Invalid content type for this action" }, { status: 400 });
        }

        // Hide comment
        await (supabase as any)
          .from("comments")
          .update({
            is_hidden: true,
            hidden_by: user.id,
            hidden_reason: "Hidden due to content policy violation",
          })
          .eq("id", content_id);

        // Update report
        await (supabase as any)
          .from("content_reports")
          .update({
            status: "action_taken",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: "Comment hidden",
          })
          .eq("id", report_id);

        // Log admin action
        await (supabase as any).from("admin_actions").insert({
          admin_id: user.id,
          action_type: "hide_comment",
          target_type: "comment",
          target_id: content_id,
          reason: "Content policy violation",
        });

        actionTaken = "hide_comment";
        message = "Comment has been hidden";
        break;

      case "ban_user":
        if (content_type !== "user") {
          return NextResponse.json({ error: "Invalid content type for this action" }, { status: 400 });
        }

        // Ban user
        await (supabase as any)
          .from("users")
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            ban_reason: "Banned due to policy violations",
            banned_by: user.id,
          })
          .eq("id", content_id);

        // Update report
        await (supabase as any)
          .from("content_reports")
          .update({
            status: "action_taken",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            action_taken: "User banned",
          })
          .eq("id", report_id);

        // Log admin action
        await (supabase as any).from("admin_actions").insert({
          admin_id: user.id,
          action_type: "ban_user",
          target_type: "user",
          target_id: content_id,
          reason: "Policy violations",
        });

        actionTaken = "ban_user";
        message = "User has been banned";
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action: actionTaken, message });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
