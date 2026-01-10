import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log("Applying migration...");

  // Add custom_metadata column
  const { error: error1 } = await supabase.rpc("exec_sql", {
    sql: `ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '{}'::jsonb;`
  });
  if (error1) console.log("custom_metadata:", error1.message);
  else console.log("✓ Added custom_metadata column");

  // Add media_type column
  const { error: error2 } = await supabase.rpc("exec_sql", {
    sql: `ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video';`
  });
  if (error2) console.log("media_type:", error2.message);
  else console.log("✓ Added media_type column");

  // Create indexes
  const { error: error3 } = await supabase.rpc("exec_sql", {
    sql: `CREATE INDEX IF NOT EXISTS idx_videos_custom_metadata ON public.videos USING GIN (custom_metadata);`
  });
  if (error3) console.log("idx_custom_metadata:", error3.message);
  else console.log("✓ Created custom_metadata index");

  const { error: error4 } = await supabase.rpc("exec_sql", {
    sql: `CREATE INDEX IF NOT EXISTS idx_videos_media_type ON public.videos(user_id, media_type);`
  });
  if (error4) console.log("idx_media_type:", error4.message);
  else console.log("✓ Created media_type index");

  console.log("\nMigration complete!");
}

applyMigration().catch(console.error);
