"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface SearchFiltersProps {
  currentSort: string;
  currentDuration: string;
  currentDate: string;
  currentCategory: string;
  categories: Category[];
}

export function SearchFilters({
  currentSort,
  currentDuration,
  currentDate,
  currentCategory,
  categories,
}: SearchFiltersProps) {
  const t = useTranslations("search");
  const tc = useTranslations("categories");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "any" || value === "relevance" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">{t("filters")}</h2>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t("category")}
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => updateFilter("category", "all")}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentCategory === "all"
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tc("all")}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => updateFilter("category", category.slug)}
                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  currentCategory === category.slug
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tc(category.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort by */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {t("sortBy")}
        </h3>
        <div className="space-y-1">
          {[
            { value: "relevance", label: t("relevance") },
            { value: "date", label: t("uploadDateNewest") },
            { value: "views", label: t("viewCount") },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("sort", option.value)}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentSort === option.value
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload date */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {t("uploadDate")}
        </h3>
        <div className="space-y-1">
          {[
            { value: "any", label: "Any time" },
            { value: "hour", label: t("lastHour") },
            { value: "today", label: t("today") },
            { value: "week", label: t("thisWeek") },
            { value: "month", label: t("thisMonth") },
            { value: "year", label: t("thisYear") },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("date", option.value)}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentDate === option.value
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {t("duration")}
        </h3>
        <div className="space-y-1">
          {[
            { value: "any", label: "Any duration" },
            { value: "short", label: t("short") },
            { value: "medium", label: t("medium") },
            { value: "long", label: t("long") },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter("duration", option.value)}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                currentDuration === option.value
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
