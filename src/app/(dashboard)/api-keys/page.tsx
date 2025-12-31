"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Copy, Trash2, Key, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const loadKeys = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("api_keys")
      .select("id, name, key_prefix, is_active, last_used_at, created_at")
      .order("created_at", { ascending: false });

    setKeys(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const generateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "av_live_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const hashKey = async (key: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const key = generateKey();
      const keyHash = await hashKey(key);
      const keyPrefix = key.substring(0, 12);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("api_keys")
        .insert({
          user_id: user.id,
          name: newKeyName,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          permissions: { read: true, write: true, delete: false },
        });

      if (error) {
        toast.error("Failed to create API key");
        return;
      }

      setNewKey(key);
      loadKeys();
      toast.success("API key created!");
    } catch {
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete API key");
      return;
    }

    loadKeys();
    toast.success("API key deleted");
  };

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setNewKeyName("");
    setNewKey(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500">Manage API keys for external integrations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {newKey ? "API Key Created" : "Create API Key"}
              </DialogTitle>
            </DialogHeader>

            {newKey ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Copy your API key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newKey}
                    readOnly
                    className="bg-gray-100 border-gray-300 text-gray-900 font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy} className="border-gray-300">
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button onClick={closeDialog} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName" className="text-gray-700">
                    Key Name
                  </Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production, 1study Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Key"
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Your API Keys</CardTitle>
          <CardDescription className="text-gray-500">
            Use these keys to authenticate API requests from external applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : keys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-500">Name</TableHead>
                  <TableHead className="text-gray-500">Key</TableHead>
                  <TableHead className="text-gray-500">Status</TableHead>
                  <TableHead className="text-gray-500">Last Used</TableHead>
                  <TableHead className="text-gray-500">Created</TableHead>
                  <TableHead className="text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={key.is_active ? "bg-emerald-500" : "bg-red-500"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
              <p className="text-gray-500 mb-4">
                Create an API key to integrate with external applications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">API Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Get Video HLS URL</h4>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-x-auto">
{`curl -X GET "https://unlimvideo.com/api/public/videos/{videoId}" \\
  -H "X-API-Key: uv_live_xxxxx"`}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Video</h4>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 overflow-x-auto">
{`curl -X POST "https://unlimvideo.com/api/public/videos" \\
  -H "X-API-Key: uv_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My Video", "filename": "video.mp4", "size": 10485760}'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
