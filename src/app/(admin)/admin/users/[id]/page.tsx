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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { User } from "@/types/database";

const GB = 1024 * 1024 * 1024;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [storageLimitGb, setStorageLimitGb] = useState(10);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadUser() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        toast.error("User not found");
        router.push("/admin/users");
        return;
      }

      setUser(data);
      setName(data.name || "");
      setRole(data.role);
      setStorageLimitGb(Math.round(data.storage_limit_bytes / GB));
      setIsActive(data.is_active);
      setLoading(false);
    }

    loadUser();
  }, [userId, supabase, router]);

  const handleSave = async () => {
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
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

      toast.success("User updated successfully");
      router.push("/admin/users");
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
              onChange={(e) => setStorageLimitGb(parseInt(e.target.value) || 10)}
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
    </div>
  );
}
