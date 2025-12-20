"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2 } from "lucide-react";

const plans = [
  { name: "Free", price: "$0", storage: "10 GB", storageBytres: 10 * 1024 * 1024 * 1024, current: true },
  { name: "Starter", price: "$9/mo", storage: "100 GB", storageBytes: 100 * 1024 * 1024 * 1024, current: false },
  { name: "Pro", price: "$39/mo", storage: "500 GB", storageBytes: 500 * 1024 * 1024 * 1024, current: false, popular: true },
  { name: "Business", price: "$149/mo", storage: "2 TB", storageBytes: 2 * 1024 * 1024 * 1024 * 1024, current: false },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(10 * 1024 * 1024 * 1024);
  const supabase = createClient();

  useEffect(() => {
    async function loadUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("users")
        .select("storage_used_bytes, storage_limit_bytes")
        .eq("id", user.id)
        .single();

      if (data) {
        setStorageUsed(data.storage_used_bytes || 0);
        setStorageLimit(data.storage_limit_bytes || 10 * 1024 * 1024 * 1024);
      }
      setLoading(false);
    }

    loadUsage();
  }, [supabase]);

  const usagePercent = Math.round((storageUsed / storageLimit) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription</h1>
        <p className="text-gray-400">Manage your plan and billing</p>
      </div>

      {/* Current Usage */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Current Usage</CardTitle>
          <CardDescription className="text-gray-400">
            Your storage usage this billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Storage</span>
            <span className="text-white">
              {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-gray-500">{usagePercent}% of your storage used</p>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-gray-900 border-gray-800 relative ${
                plan.popular ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-white">{plan.price}</div>
                <CardDescription className="text-gray-400">
                  {plan.storage} storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    HLS transcoding
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    API access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    CDN delivery
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant={plan.name === "Free" ? "outline" : "default"}
                  disabled={plan.name === "Free"}
                >
                  {plan.name === "Free" ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Need more storage? Contact us at hello@allvideo.one for enterprise plans up to 100TB.
      </p>
    </div>
  );
}
