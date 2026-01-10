"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Webhook,
  MoreVertical,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/ui/code-block";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { id: "media.uploaded", label: "Media Uploaded", desc: "When a file upload completes" },
  { id: "media.processing", label: "Media Processing", desc: "When processing starts" },
  { id: "media.ready", label: "Media Ready", desc: "When processing completes successfully" },
  { id: "media.failed", label: "Media Failed", desc: "When processing fails" },
  { id: "media.deleted", label: "Media Deleted", desc: "When media is deleted" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["media.ready", "media.failed"]);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch("/api/webhooks");
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, events: selectedEvents }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create webhook");
      }

      const data = await response.json();
      setWebhooks([data.webhook, ...webhooks]);
      setNewSecret(data.webhook.secret);
      setDialogOpen(false);
      setName("");
      setUrl("");
      setSelectedEvents(["media.ready", "media.failed"]);
      toast.success("Webhook created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;

    setDeletingId(id);
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !is_active }),
      });
      setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, is_active: !is_active } : w)));
      toast.success(is_active ? "Webhook disabled" : "Webhook enabled");
    } catch {
      toast.error("Failed to update webhook");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-500">Receive real-time notifications when events happen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Add a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Webhook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <Checkbox
                        id={event.id}
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div>
                        <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                          {event.label}
                        </label>
                        <p className="text-xs text-gray-500">{event.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Secret Display (shown after creation) */}
      {newSecret && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="font-medium text-yellow-800">Save your webhook secret</p>
                <p className="text-sm text-yellow-700 mb-2">
                  This secret is only shown once. Use it to verify webhook signatures.
                </p>
                <div className="flex items-center gap-2 bg-white border border-yellow-300 rounded px-3 py-2">
                  <code className="flex-1 font-mono text-sm">
                    {showSecret ? newSecret : "•".repeat(40)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                    className="h-6 w-6"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(newSecret)}
                    className="h-6 w-6"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setNewSecret(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : webhooks.length > 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {webhook.url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event.split(".")[1]}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.is_active ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                      {webhook.failure_count > 0 && (
                        <Badge className="ml-1 bg-red-100 text-red-700">
                          {webhook.failure_count} failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => handleToggle(webhook.id, webhook.is_active)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {webhook.is_active ? "Disable" : "Enable"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleDelete(webhook.id)}
                            disabled={deletingId === webhook.id}
                          >
                            {deletingId === webhook.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-16 text-center">
            <Webhook className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No webhooks yet</h3>
            <p className="text-gray-500 mb-4">
              Add a webhook to receive notifications when events occur
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signature Verification Guide */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Verifying Webhook Signatures</CardTitle>
          <CardDescription>
            All webhooks include a signature header for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            language="javascript"
            code={`// Node.js example
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

// In your webhook handler
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhook(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  const { event, data } = req.body;
  console.log('Received:', event, data);

  res.status(200).send('OK');
});`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
