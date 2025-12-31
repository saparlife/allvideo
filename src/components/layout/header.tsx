"use client";

import { useState, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const avatarButton = (
    <div className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors cursor-pointer">
      <span className="text-sm text-gray-700">{user.name || user.email}</span>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        {/* Breadcrumb or title can go here */}
      </div>

      {!mounted ? (
        avatarButton
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
              <span className="text-sm text-gray-700">{user.name || user.email}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
            <DropdownMenuLabel className="text-gray-500">
              <div className="flex flex-col">
                <span className="text-gray-900">{user.name || "User"}</span>
                <span className="text-xs font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem asChild className="text-gray-700 hover:text-gray-900 focus:bg-gray-100">
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-gray-700 hover:text-gray-900 focus:bg-gray-100">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
