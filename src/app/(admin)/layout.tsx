import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import type { User } from "@/types/database";

export default async function AdminLayout({
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

  // Check if admin
  if (profile?.role !== "admin") {
    redirect("/studio");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg">
              Admin Panel
            </Link>
            <nav className="flex gap-4">
              <Link href="/admin" className="hover:underline">Dashboard</Link>
              <Link href="/admin/users" className="hover:underline">Users</Link>
              <Link href="/admin/videos" className="hover:underline">Videos</Link>
              <Link href="/admin/reports" className="hover:underline">Reports</Link>
            </nav>
          </div>
          <Link href="/studio" className="text-sm hover:underline">
            ← Back to Studio
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
