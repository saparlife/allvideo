"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  Key,
  Settings,
  CreditCard,
  Users,
  BarChart3,
  LogOut,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isAdmin?: boolean;
}

const userNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Videos",
    href: "/videos",
    icon: Video,
  },
  {
    title: "API Keys",
    href: "/api-keys",
    icon: Key,
  },
  {
    title: "Subscription",
    href: "/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const adminNavItems = [
  {
    title: "Admin Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "All Videos",
    href: "/admin/videos",
    icon: Video,
  },
];

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">1stream</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {userNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <Separator className="my-4 bg-gray-200" />
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Admin
            </p>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
