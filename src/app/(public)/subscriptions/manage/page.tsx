"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, UserMinus, Bell, BellOff, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Subscription {
  id: string;
  channel_id: string;
  created_at: string;
  notifications: boolean;
  channel: {
    id: string;
    username: string;
    avatar_url: string | null;
    subscribers_count: number;
  };
}

export default function ManageSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else if (response.status === 401) {
        window.location.href = "/login?redirect=/subscriptions/manage";
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async (subscription: Subscription) => {
    if (!confirm(`Unsubscribe from @${subscription.channel.username}?`)) return;

    try {
      const response = await fetch(
        `/api/channels/${subscription.channel.username}/subscribe`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setSubscriptions((prev) =>
          prev.filter((s) => s.id !== subscription.id)
        );
        toast.success(`Unsubscribed from @${subscription.channel.username}`);
      } else {
        toast.error("Failed to unsubscribe");
      }
    } catch {
      toast.error("Failed to unsubscribe");
    }
  };

  const toggleNotifications = async (subscription: Subscription) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications: !subscription.notifications }),
      });

      if (response.ok) {
        setSubscriptions((prev) =>
          prev.map((s) =>
            s.id === subscription.id
              ? { ...s, notifications: !s.notifications }
              : s
          )
        );
        toast.success(
          subscription.notifications
            ? "Notifications disabled"
            : "Notifications enabled"
        );
      } else {
        toast.error("Failed to update notifications");
      }
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            {subscriptions.length} channel{subscriptions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/subscriptions"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          View feed →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You're not subscribed to any channels</p>
          <Link
            href="/channels"
            className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
          >
            Discover channels
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Link
                href={`/channel/${subscription.channel.username}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  {subscription.channel.avatar_url ? (
                    <img
                      src={subscription.channel.avatar_url}
                      alt={subscription.channel.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {subscription.channel.username[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {subscription.channel.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatNumber(subscription.channel.subscribers_count || 0)} subscribers
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleNotifications(subscription)}
                  className={subscription.notifications ? "text-indigo-600" : "text-gray-400"}
                  title={subscription.notifications ? "Disable notifications" : "Enable notifications"}
                >
                  {subscription.notifications ? (
                    <Bell className="h-5 w-5" />
                  ) : (
                    <BellOff className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnsubscribe(subscription)}
                  className="text-gray-400 hover:text-red-500"
                  title="Unsubscribe"
                >
                  <UserMinus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
