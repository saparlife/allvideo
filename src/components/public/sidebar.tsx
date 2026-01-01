"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface SidebarProps {
  user?: { id: string } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const mainLinks = [
    {
      href: "/",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: t("home"),
    },
    {
      href: "/shorts",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      label: "Shorts",
    },
    {
      href: "/trending",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      label: t("trending"),
    },
    {
      href: "/new",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t("new"),
    },
    {
      href: "/subscriptions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: t("subscriptions"),
      requireAuth: true,
    },
  ];

  const libraryLinks = [
    {
      href: "/history",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t("history"),
      requireAuth: true,
    },
    {
      href: "/liked",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      label: t("likedVideos"),
      requireAuth: true,
    },
    {
      href: "/playlists",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: t("playlists"),
      requireAuth: true,
    },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-14 bottom-0 w-56 border-r bg-white overflow-y-auto">
      <nav className="py-3">
        {/* Main links */}
        <div className="px-2">
          {mainLinks.map((link) => {
            if (link.requireAuth && !user) return null;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-gray-100 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className={isActive ? "text-indigo-600" : "text-gray-600"}>
                  {link.icon}
                </span>
                <span className={isActive ? "text-gray-900" : "text-gray-700"}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Library section */}
        {user && (
          <>
            <hr className="my-3 border-gray-200" />
            <div className="px-2">
              <h3 className="px-3 py-2 text-sm font-medium text-gray-500">
                {t("library")}
              </h3>
              {libraryLinks.map((link) => {
                if (link.requireAuth && !user) return null;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className={isActive ? "text-indigo-600" : "text-gray-600"}>
                      {link.icon}
                    </span>
                    <span className={isActive ? "text-gray-900" : "text-gray-700"}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Studio link */}
        {user && (
          <>
            <hr className="my-3 border-gray-200" />
            <div className="px-2">
              <Link
                href="/studio"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
                <span className="text-gray-700">{t("studio")}</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <span className="text-gray-700">{t("settings")}</span>
              </Link>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
