import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Film,
  Music,
  Gamepad2,
  BookOpen,
  Briefcase,
  Palette,
  Dumbbell,
  Utensils,
  Car,
  Home,
  Heart,
  Globe,
  Mic,
  Tv,
  Camera,
  Layers
} from "lucide-react";

export const metadata = {
  title: "Browse Categories - UnlimVideo",
  description: "Explore videos by category",
};

const categoryIcons: Record<string, any> = {
  entertainment: Film,
  music: Music,
  gaming: Gamepad2,
  education: BookOpen,
  business: Briefcase,
  art: Palette,
  sports: Dumbbell,
  food: Utensils,
  automotive: Car,
  lifestyle: Home,
  health: Heart,
  travel: Globe,
  podcasts: Mic,
  shows: Tv,
  photography: Camera,
  default: Layers,
};

const categoryColors: Record<string, string> = {
  entertainment: "from-pink-500 to-rose-500",
  music: "from-purple-500 to-violet-500",
  gaming: "from-green-500 to-emerald-500",
  education: "from-blue-500 to-cyan-500",
  business: "from-slate-500 to-gray-600",
  art: "from-amber-500 to-orange-500",
  sports: "from-red-500 to-rose-500",
  food: "from-yellow-500 to-amber-500",
  automotive: "from-zinc-500 to-neutral-600",
  lifestyle: "from-teal-500 to-cyan-500",
  health: "from-emerald-500 to-green-500",
  travel: "from-sky-500 to-blue-500",
  podcasts: "from-indigo-500 to-purple-500",
  shows: "from-fuchsia-500 to-pink-500",
  photography: "from-orange-500 to-red-500",
  default: "from-gray-500 to-slate-500",
};

async function CategoriesContent() {
  const supabase = await createClient();

  // Get all categories with video counts
  const { data: categories, error } = await (supabase as any)
    .from("categories")
    .select(`
      id,
      slug,
      name,
      description,
      videos:videos(count)
    `)
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load categories</p>
      </div>
    );
  }

  // If no categories in DB, show default ones
  const defaultCategories = [
    { slug: "entertainment", name: "Entertainment", description: "Movies, shows, and fun content" },
    { slug: "music", name: "Music", description: "Music videos, covers, and performances" },
    { slug: "gaming", name: "Gaming", description: "Game playthroughs, reviews, and esports" },
    { slug: "education", name: "Education", description: "Learning and tutorials" },
    { slug: "sports", name: "Sports", description: "Sports highlights and fitness" },
    { slug: "news", name: "News", description: "Current events and journalism" },
    { slug: "technology", name: "Technology", description: "Tech reviews and tutorials" },
    { slug: "lifestyle", name: "Lifestyle", description: "Vlogs, fashion, and daily life" },
  ];

  const displayCategories = categories?.length > 0 ? categories : defaultCategories;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayCategories.map((category: any) => {
          const IconComponent = categoryIcons[category.slug] || categoryIcons.default;
          const colorClass = categoryColors[category.slug] || categoryColors.default;
          const videoCount = category.videos?.[0]?.count || 0;

          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-6 transition-transform hover:scale-[1.02]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-90`} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">
                  {typeof category.name === "object" ? category.name.en || category.name : category.name}
                </h2>
                <p className="text-sm text-white/80 line-clamp-2">
                  {typeof category.description === "object"
                    ? category.description.en || category.description
                    : category.description}
                </p>
                {videoCount > 0 && (
                  <p className="mt-3 text-xs text-white/70">
                    {videoCount.toLocaleString()} video{videoCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* All videos link */}
      <div className="mt-8 text-center">
        <Link
          href="/trending"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Or browse all trending videos →
        </Link>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-40 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
