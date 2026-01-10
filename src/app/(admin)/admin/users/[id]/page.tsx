"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { User, Subscription } from "@/types/database";

const GB = 1024 * 1024 * 1024;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingMonths, setAddingMonths] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [storageLimitGb, setStorageLimitGb] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [monthsToAdd, setMonthsToAdd] = useState(1);

  useEffect(() => {
    async function loadUser() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: userData, error: userError } = await db
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        toast.error("User not found");
        router.push("/admin/users");
        return;
      }

      // Get subscription
      const { data: subData } = await db
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setUser(userData);
      setSubscription(subData);
      setName(userData.name || "");
      setRole(userData.role);
      setStorageLimitGb(Math.round(userData.storage_limit_bytes / GB));
      setIsActive(userData.is_active);
      setLoading(false);
    }

    loadUser();
  }, [userId, supabase, router]);

  const handleSave = async () => {
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { error } = await db
        .from("users")
        .update({
          name,
          role,
          storage_limit_bytes: storageLimitGb * GB,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        toast.error("Failed to update user");
        return;
      }

      // Update subscription storage limit if exists
      if (subscription) {
        await db
          .from("subscriptions")
          .update({
            storage_limit_gb: storageLimitGb,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);
      }

      toast.success("User updated successfully");
      router.push("/admin/users");
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMonths = async () => {
    setAddingMonths(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const now = new Date();

      if (subscription) {
        // Extend existing subscription
        const currentExpiry = subscription.expires_at ? new Date(subscription.expires_at) : now;
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate);
        newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

        const { error } = await db
          .from("subscriptions")
          .update({
            expires_at: newExpiry.toISOString(),
            is_active: true,
            updated_at: now.toISOString(),
          })
          .eq("id", subscription.id);

        if (error) {
          toast.error("Failed to extend subscription");
          return;
        }

        setSubscription({
          ...subscription,
          expires_at: newExpiry.toISOString(),
          is_active: true,
        });

        toast.success(`Added ${monthsToAdd} month(s) - expires ${newExpiry.toLocaleDateString()}`);
      } else {
        // Create new subscription
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);

        const { data: newSub, error } = await db
          .from("subscriptions")
          .insert({
            user_id: userId,
            tier: "starter",
            storage_limit_gb: storageLimitGb,
            bandwidth_limit_gb: 100,
            starts_at: now.toISOString(),
            expires_at: expiryDate.toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          toast.error("Failed to create subscription");
          return;
        }

        setSubscription(newSub);
        toast.success(`Subscription created - expires ${expiryDate.toLocaleDateString()}`);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setAddingMonths(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const subscriptionStatus = subscription?.expires_at
    ? new Date(subscription.expires_at) > new Date()
      ? "active"
      : "expired"
    : "none";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/users">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit User</h1>
          <p className="text-gray-400">{user?.email}</p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-200">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-200">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storage" className="text-gray-200">Storage Limit (GB)</Label>
            <Input
              id="storage"
              type="number"
              min={1}
              value={storageLimitGb}
              onChange={(e) => setStorageLimitGb(parseInt(e.target.value) || 1)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500">
              Currently using: {user ? Math.round(user.storage_used_bytes / GB * 100) / 100 : 0} GB
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="active" className="text-gray-200">Account Active</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-400">Status</p>
              <p className={`font-medium ${
                subscriptionStatus === "active"
                  ? "text-green-400"
                  : subscriptionStatus === "expired"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}>
                {subscriptionStatus === "active"
                  ? "Active"
                  : subscriptionStatus === "expired"
                    ? "Expired"
                    : "No subscription"}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Tier</p>
              <p className="font-medium text-white capitalize">
                {subscription?.tier || "Free"}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">Expires</p>
              <p className="font-medium text-white">
                {subscription?.expires_at
                  ? new Date(subscription.expires_at).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <Label className="text-gray-200 mb-2 block">Add Subscription Months</Label>
            <div className="flex items-center gap-3">
              <Select
                value={monthsToAdd.toString()}
                onValueChange={(v) => setMonthsToAdd(parseInt(v))}
              >
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "month" : "months"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddMonths}
                disabled={addingMonths}
                className="bg-green-600 hover:bg-green-700"
              >
                {addingMonths ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Months
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {subscription?.expires_at
                ? `Current expiry: ${new Date(subscription.expires_at).toLocaleDateString()}`
                : "Will create a new subscription starting today"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
