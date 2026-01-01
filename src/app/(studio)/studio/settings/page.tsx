"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  tier: string;
  storage_limit_gb: number;
  bandwidth_limit_gb: number;
  is_active: boolean;
  expires_at: string | null;
}

export default function StudioSettingsPage() {
  const t = useTranslations("studio");
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const profileResponse = await fetch("/api/profile");
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setProfile(data.profile);
      }

      // Fetch subscription
      const subResponse = await fetch("/api/subscriptions");
      if (subResponse.ok) {
        const data = await subResponse.json();
        setSubscription(data.subscription);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const tierLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    business: "Business",
    scale: "Scale",
    enterprise: "Enterprise",
    enterprise_plus: "Enterprise Plus",
    ultimate: "Ultimate",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("settings")}</h1>

      <div className="space-y-6">
        {/* Account Info */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900">{profile?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Username
              </label>
              <p className="text-gray-900">@{profile?.username || "Not set"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Member since
              </label>
              <p className="text-gray-900">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Subscription</h2>
            <a
              href="/pricing"
              className="text-sm text-indigo-600 hover:underline cursor-pointer"
            >
              Manage subscription
            </a>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.tier === "free"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {tierLabels[subscription.tier] || subscription.tier}
                </span>
                {subscription.is_active && subscription.tier !== "free" && (
                  <span className="text-sm text-green-600">Active</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Storage
                  </label>
                  <p className="text-gray-900">{subscription.storage_limit_gb} GB</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bandwidth
                  </label>
                  <p className="text-gray-900">{subscription.bandwidth_limit_gb} GB/month</p>
                </div>
              </div>

              {subscription.expires_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Renews on
                  </label>
                  <p className="text-gray-900">
                    {new Date(subscription.expires_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">You are on the free plan</p>
              <a
                href="/pricing"
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Upgrade now
              </a>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="font-semibold text-red-700 mb-4">Danger Zone</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Log out</p>
                <p className="text-sm text-gray-500">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete account</p>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => toast.error("Please contact support to delete your account")}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
