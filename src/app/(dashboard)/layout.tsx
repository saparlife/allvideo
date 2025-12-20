import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import type { User } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single() as { data: User | null };

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col">
        <Header
          user={{
            email: user.email!,
            name: profile?.name,
            avatar_url: profile?.avatar_url,
          }}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
