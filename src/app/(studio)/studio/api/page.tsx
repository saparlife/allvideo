import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApiPageClient } from "./api-page-client";

export default async function ApiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch existing API keys
  const { data: apiKeys } = await (supabase as any)
    .from("api_keys")
    .select("id, name, key_prefix, permissions, rate_limit_per_minute, is_active, last_used_at, expires_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ApiPageClient initialKeys={apiKeys || []} />;
}
