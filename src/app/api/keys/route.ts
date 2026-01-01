import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";

// Generate a secure API key
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `av_${randomBytes(32).toString("hex")}`;
  const prefix = key.slice(0, 10);
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

// GET /api/keys - List user's API keys
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await (supabase as any)
    .from("api_keys")
    .select("id, name, key_prefix, permissions, rate_limit_per_minute, is_active, last_used_at, expires_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

// POST /api/keys - Create new API key
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, permissions, rate_limit_per_minute, expires_at } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate the API key
    const { key, prefix, hash } = generateApiKey();

    // Create the key record
    const { data, error } = await (supabase as any)
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash: hash,
        permissions: permissions || { read: true, write: false, delete: false },
        rate_limit_per_minute: rate_limit_per_minute || 60,
        expires_at: expires_at || null,
      })
      .select("id, name, key_prefix, permissions, rate_limit_per_minute, is_active, expires_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the key only once - it won't be retrievable later
    return NextResponse.json({
      key,
      apiKey: data,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
