import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/public/header";
import { Sidebar } from "@/components/public/sidebar";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile if logged in
  let userProfile = null;
  if (user) {
    const { data } = await (supabase as any)
      .from("users")
      .select("id, email, username, avatar_url")
      .eq("id", user.id)
      .single();
    userProfile = data;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={userProfile} />
      <div className="flex">
        <Sidebar user={userProfile} />
        <main className="flex-1 lg:ml-56">{children}</main>
      </div>
    </div>
  );
}
