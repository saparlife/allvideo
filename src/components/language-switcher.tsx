"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Remove current locale prefix if present
    let newPath = pathname;
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
        newPath = pathname.slice(loc.length + 1) || "/";
        break;
      }
    }

    // Add new locale prefix for non-default locales
    if (newLocale !== "en") {
      newPath = `/${newLocale}${newPath === "/" ? "" : newPath}`;
    }

    router.push(newPath);
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <span className="text-sm">{localeFlags[locale]}</span>
        <span className="text-sm font-medium text-gray-700">
          {locale.toUpperCase()}
        </span>
        <svg
          className="w-3.5 h-3.5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div className="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleChange(loc)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors cursor-pointer ${
              locale === loc ? "text-indigo-600 font-medium" : "text-gray-700"
            }`}
          >
            <span>{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
            {locale === loc && (
              <svg
                className="w-4 h-4 ml-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
