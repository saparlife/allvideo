import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudioSidebar } from "./studio-sidebar";
import { StudioHeader } from "./studio-header";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/studio");
  }

  // Get user profile
  const { data: profile } = await (supabase as any)
    .from("users")
    .select("id, email, username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <StudioHeader user={profile} />
      <div className="flex">
        <StudioSidebar />
        <main className="flex-1 ml-56 p-6">{children}</main>
      </div>
    </div>
  );
}
