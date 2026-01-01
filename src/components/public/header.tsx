"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../language-switcher";
import { NotificationBell } from "../notifications/notification-bell";
import { SearchBar } from "./search-bar";

interface HeaderProps {
  user?: {
    id: string;
    email?: string;
    username?: string;
    avatar_url?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
            UnlimVideo
          </span>
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {user ? (
            <>
              {/* Upload button */}
              <Link
                href="/studio/upload"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden md:inline">{t("studio.upload")}</span>
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu */}
              <Link href="/studio" className="cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user.username?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors cursor-pointer"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
