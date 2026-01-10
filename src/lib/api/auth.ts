import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface ApiKeyAuth {
  userId: string;
  keyId: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

export async function verifyApiKey(request: Request): Promise<ApiKeyAuth | null> {
  // Support both X-API-Key header and Bearer token
  let apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.slice(7);
    }
  }

  if (!apiKey) {
    return null;
  }

  // Hash the provided key
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: keyData, error } = await (supabase as any)
    .from("api_keys")
    .select("id, user_id, permissions, is_active")
    .eq("key_hash", keyHash)
    .single();

  if (error || !keyData || !keyData.is_active) {
    return null;
  }

  // Update last_used_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyData.id);

  return {
    userId: keyData.user_id,
    keyId: keyData.id,
    permissions: keyData.permissions,
  };
}

export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess(data: Record<string, unknown>, status: number = 200) {
  return Response.json(data, { status });
}
