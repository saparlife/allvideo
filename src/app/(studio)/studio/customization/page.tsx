"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  discord?: string;
}

interface Profile {
  id: string;
  username: string | null;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  social_links: SocialLinks | null;
}

export default function StudioCustomizationPage() {
  const t = useTranslations("studio");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setUsername(data.profile.username || "");
        setBio(data.profile.bio || "");
        setWebsite(data.profile.website || "");
        setSocialLinks(data.profile.social_links || {});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log("Saving profile:", { username, bio, website, social_links: socialLinks });

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          bio,
          website,
          social_links: socialLinks,
        }),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        setProfile(data.profile);
        toast.success("Changes saved!");
      } else {
        toast.error(data.error || "Failed to save changes");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("customization")}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Channel banner</h2>
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            {profile?.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <button className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors cursor-pointer">
                Upload banner
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Recommended size: 2048 x 1152 pixels
          </p>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile picture</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {username?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              Change picture
            </button>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Basic info</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="username"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This will be your channel URL: unlimvideo.com/channel/{username || "username"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                placeholder="Tell viewers about your channel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Social links</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add your social media handles to let viewers connect with you
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 flex justify-center">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialLinks.twitter || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="username (without @)"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 flex justify-center">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialLinks.instagram || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="username (without @)"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 flex justify-center">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialLinks.youtube || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="channel handle (without @)"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 flex justify-center">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialLinks.tiktok || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="username (without @)"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 flex justify-center">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialLinks.discord || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Discord invite link (https://discord.gg/...)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
