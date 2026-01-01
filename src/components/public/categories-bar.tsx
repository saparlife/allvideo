"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
}

// Default categories until we fetch from database
const defaultCategories: Category[] = [
  { id: "all", slug: "all", name: "all" },
  { id: "gaming", slug: "gaming", name: "gaming" },
  { id: "music", slug: "music", name: "music" },
  { id: "entertainment", slug: "entertainment", name: "entertainment" },
  { id: "education", slug: "education", name: "education" },
  { id: "sports", slug: "sports", name: "sports" },
  { id: "news", slug: "news", name: "news" },
  { id: "technology", slug: "technology", name: "technology" },
  { id: "travel", slug: "travel", name: "travel" },
  { id: "howto", slug: "howto", name: "howto" },
  { id: "comedy", slug: "comedy", name: "comedy" },
];

interface CategoriesBarProps {
  categories?: Category[];
  activeCategory?: string;
}

export function CategoriesBar({
  categories = defaultCategories,
  activeCategory = "all",
}: CategoriesBarProps) {
  const t = useTranslations("categories");
  const searchParams = useSearchParams();

  return (
    <div className="sticky top-14 z-40 bg-white border-b">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const isActive = activeCategory === category.slug;
            return (
              <Link
                key={category.id}
                href={
                  category.slug === "all"
                    ? "/"
                    : `/category/${category.slug}`
                }
                className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t(category.name)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
