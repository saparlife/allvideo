"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, Infinity } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29/mo",
    storage: "50 GB",
    storageBytes: 50 * 1024 * 1024 * 1024,
    features: ["50 GB storage", "Unlimited bandwidth", "1080p transcoding", "API access"],
    current: false
  },
  {
    name: "Growth",
    price: "$79/mo",
    storage: "200 GB",
    storageBytes: 200 * 1024 * 1024 * 1024,
    features: ["200 GB storage", "Unlimited bandwidth", "1080p transcoding", "Analytics", "Priority support"],
    current: false,
    popular: true
  },
  {
    name: "Scale",
    price: "$199/mo",
    storage: "1 TB",
    storageBytes: 1024 * 1024 * 1024 * 1024,
    features: ["1 TB storage", "Unlimited bandwidth", "1080p transcoding", "Advanced analytics", "Custom branding"],
    current: false
  },
  {
    name: "Enterprise",
    price: "$499/mo",
    storage: "5 TB",
    storageBytes: 5 * 1024 * 1024 * 1024 * 1024,
    features: ["5 TB storage", "Unlimited bandwidth", "1080p transcoding", "White-label", "SLA guarantee"],
    current: false
  },
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
  const [storageLimit, setStorageLimit] = useState(50 * 1024 * 1024 * 1024);
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
        setStorageLimit(data.storage_limit_bytes || 50 * 1024 * 1024 * 1024);
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

          <div className="flex items-center gap-2 mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <Infinity className="w-5 h-5 text-violet-400" />
            <span className="text-violet-400 text-sm">Unlimited bandwidth included with all plans</span>
          </div>
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
                plan.popular ? "ring-2 ring-violet-500" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-500">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-white">{plan.price}</div>
                <CardDescription className="text-gray-400">
                  {plan.storage} storage
                </CardDescription>
                <div className="flex items-center gap-1 mt-1">
                  <Infinity className="w-3 h-3 text-violet-400" />
                  <span className="text-violet-400 text-xs">Unlimited bandwidth</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Need more storage? Contact us at hello@unlimvideo.com for custom enterprise plans.
      </p>
    </div>
  );
}
