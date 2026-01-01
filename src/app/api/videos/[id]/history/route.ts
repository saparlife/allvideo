import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Anonymous users don't get history tracked
    return NextResponse.json({ success: true });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const watchTime = body.watchTime || 0;

    // Upsert watch history
    const { error } = await (supabase as any)
      .from("watch_history")
      .upsert(
        {
          user_id: user.id,
          video_id: id,
          watch_time: watchTime,
          watched_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,video_id",
        }
      );

    if (error) {
      console.error("Error tracking watch history:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true });
  }
}
