"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  user: {
    email: string;
    name?: string | null;
    avatar_url?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6">
      <div>
        {/* Breadcrumb or title can go here */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 hover:bg-gray-800 rounded-lg p-2 transition-colors">
            <span className="text-sm text-gray-300">{user.name || user.email}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
          <DropdownMenuLabel className="text-gray-400">
            <div className="flex flex-col">
              <span className="text-white">{user.name || "User"}</span>
              <span className="text-xs font-normal">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem asChild className="text-gray-300 hover:text-white focus:bg-gray-700">
            <Link href="/settings">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="text-gray-300 hover:text-white focus:bg-gray-700">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 focus:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
