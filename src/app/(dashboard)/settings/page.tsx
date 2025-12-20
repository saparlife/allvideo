"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      if (data) {
        setName(data.name || "");
      }
      setLoading(false);
    }

    loadUser();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("users")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to save settings");
        return;
      }

      toast.success("Settings saved!");
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
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Profile</CardTitle>
          <CardDescription className="text-gray-400">
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-200">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-gray-800 border-gray-700 text-gray-400"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

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
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Danger Zone</CardTitle>
          <CardDescription className="text-gray-400">
            Irreversible actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Contact support to delete your account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
