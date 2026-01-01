"use client";

import { useState, useEffect } from "react";
import { Bell, Video, MessageCircle, Heart, UserPlus, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const url = filter === "unread"
        ? "/api/notifications?unread=true&limit=50"
        : "/api/notifications?limit=50";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_video":
        return <Video className="h-5 w-5 text-blue-500" />;
      case "comment":
      case "reply":
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "subscribe":
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const { type, data } = notification;
    switch (type) {
      case "new_video":
        return data.video_slug ? `/watch/${data.video_slug}` : null;
      case "comment":
      case "reply":
        return data.video_slug ? `/watch/${data.video_slug}#comments` : null;
      case "like":
        return data.video_slug ? `/watch/${data.video_slug}` : null;
      case "subscribe":
        return notification.actor?.username
          ? `/channel/${notification.actor.username}`
          : null;
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const link = getNotificationLink(notification);
            const content = (
              <div
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  !notification.read
                    ? "bg-indigo-50/50 border-indigo-100"
                    : "bg-white border-gray-100"
                } hover:bg-gray-50 transition-colors`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead([notification.id]);
                  }
                }}
              >
                <div className="flex-shrink-0">
                  {notification.actor?.avatar_url ? (
                    <img
                      src={notification.actor.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                  </div>
                )}
              </div>
            );

            return link ? (
              <Link key={notification.id} href={link} className="block">
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
