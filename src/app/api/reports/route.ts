import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_REASONS = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "copyright",
  "other",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content_type, content_id, reason, description } = await request.json();

    // Validate content type
    if (!["video", "comment", "user"].includes(content_type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Validate content_id
    if (!content_id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason" },
        { status: 400 }
      );
    }

    // Check for existing report from same user
    const { data: existing } = await (supabase as any)
      .from("content_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("content_type", content_type)
      .eq("content_id", content_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already reported this content" },
        { status: 400 }
      );
    }

    // Create report
    const { data: report, error } = await (supabase as any)
      .from("content_reports")
      .insert({
        reporter_id: user.id,
        content_type,
        content_id,
        reason,
        description: description?.trim() || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report_id: report.id });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
