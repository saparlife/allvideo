import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, User as UserIcon } from "lucide-react";
import Link from "next/link";
import type { User, Subscription } from "@/types/database";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getSubscriptionStatus(subscription: Subscription | null): "active" | "expired" | "none" {
  if (!subscription) return "none";
  if (!subscription.expires_at) return "active";
  return new Date(subscription.expires_at) > new Date() ? "active" : "expired";
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: users } = await db
    .from("users")
    .select("*")
    .order("created_at", { ascending: false }) as { data: User[] | null };

  // Get all subscriptions
  const { data: subscriptions } = await db
    .from("subscriptions")
    .select("*")
    .eq("is_active", true) as { data: Subscription[] | null };

  const subscriptionMap = new Map<string, Subscription>();
  subscriptions?.forEach((sub: Subscription) => {
    const existing = subscriptionMap.get(sub.user_id);
    if (!existing || new Date(sub.created_at) > new Date(existing.created_at)) {
      subscriptionMap.set(sub.user_id, sub);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400">Manage user accounts and subscriptions</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  <TableHead className="text-gray-400">Storage</TableHead>
                  <TableHead className="text-gray-400">Subscription</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const subscription = subscriptionMap.get(user.id);
                  const subStatus = getSubscriptionStatus(subscription || null);

                  return (
                    <TableRow key={user.id} className="border-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.name || "No name"}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-purple-600"
                              : "bg-gray-600"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="text-sm">
                          <span className="text-white">{formatBytes(user.storage_used_bytes)}</span>
                          <span className="text-gray-500"> / {formatBytes(user.storage_limit_bytes)}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full mt-1">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (user.storage_used_bytes / user.storage_limit_bytes) * 100)}%`
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={
                              subStatus === "active"
                                ? "bg-green-600"
                                : subStatus === "expired"
                                  ? "bg-red-600"
                                  : "bg-gray-600"
                            }
                          >
                            {subStatus === "active"
                              ? "Active"
                              : subStatus === "expired"
                                ? "Expired"
                                : "Free"}
                          </Badge>
                          {subscription?.expires_at && (
                            <span className="text-xs text-gray-500">
                              {subStatus === "active" ? "Expires" : "Expired"}: {new Date(subscription.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/users/${user.id}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
