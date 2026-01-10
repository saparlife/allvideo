import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

// Default categories (will be replaced by database)
const categories: Record<string, { name: { en: string; ru: string }; icon: string }> = {
  gaming: { name: { en: "Gaming", ru: "Игры" }, icon: "🎮" },
  music: { name: { en: "Music", ru: "Музыка" }, icon: "🎵" },
  entertainment: { name: { en: "Entertainment", ru: "Развлечения" }, icon: "🎬" },
  education: { name: { en: "Education", ru: "Образование" }, icon: "📚" },
  sports: { name: { en: "Sports", ru: "Спорт" }, icon: "⚽" },
  news: { name: { en: "News", ru: "Новости" }, icon: "📰" },
  technology: { name: { en: "Technology", ru: "Технологии" }, icon: "💻" },
  travel: { name: { en: "Travel", ru: "Путешествия" }, icon: "✈️" },
  howto: { name: { en: "How-to & Style", ru: "Инструкции" }, icon: "💡" },
  comedy: { name: { en: "Comedy", ru: "Юмор" }, icon: "😂" },
  film: { name: { en: "Film & Animation", ru: "Кино" }, icon: "🎥" },
  autos: { name: { en: "Autos & Vehicles", ru: "Авто" }, icon: "🚗" },
  pets: { name: { en: "Pets & Animals", ru: "Животные" }, icon: "🐾" },
  science: { name: { en: "Science", ru: "Наука" }, icon: "🔬" },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories[slug];

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: `${category.name.en} Videos`,
    description: `Watch the best ${category.name.en.toLowerCase()} videos on UnlimVideo`,
  };
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="flex gap-3 mt-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function CategoryVideos({ slug, sort }: { slug: string; sort: string }) {
  const supabase = await createClient();
  const t = await getTranslations();

  // First get the category ID from slug
  const { data: category } = await (supabase as any)
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Category not found</p>
      </div>
    );
  }

  let query = (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_key,
      duration,
      views_count,
      created_at,
      user_id,
      users:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq("status", "ready")
    .eq("visibility", "public")
    .eq("category_id", category.id);

  if (sort === "popular") {
    query = query.order("views_count", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: videos } = await query.limit(48);
  const videoList = videos || [];

  if (videoList.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">{categories[slug]?.icon || "📹"}</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No videos yet
        </h2>
        <p className="text-gray-600">
          Be the first to upload a video in this category
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videoList.map((video: any) => (
        <VideoCard
          key={video.id}
          video={{
            id: video.id,
            slug: video.slug || video.id,
            title: video.title,
            thumbnail_url: video.thumbnail_key
              ? `${CDN_URL}/${video.thumbnail_key}`
              : null,
            duration: video.duration,
            views_count: video.views_count || 0,
            created_at: video.created_at,
            channel: video.users
              ? {
                  username: video.users.username || video.users.id,
                  avatar_url: video.users.avatar_url,
                }
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort = "newest" } = await searchParams;

  const category = categories[slug];
  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Category header */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {category.name.en}
          </h1>
          <p className="text-gray-600">
            Explore the best {category.name.en.toLowerCase()} videos
          </p>
        </div>
      </div>

      {/* Sort options */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Sort by:</span>
        <div className="flex gap-2">
          {[
            { value: "newest", label: "Newest" },
            { value: "popular", label: "Most viewed" },
            { value: "oldest", label: "Oldest" },
          ].map((option) => (
            <a
              key={option.value}
              href={`/category/${slug}?sort=${option.value}`}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors cursor-pointer ${
                sort === option.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      {/* Videos grid */}
      <Suspense fallback={<VideoGridSkeleton />}>
        <CategoryVideos slug={slug} sort={sort} />
      </Suspense>
    </div>
  );
}
