import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlanByProductId, PLANS } from "@/lib/subscriptions";
import crypto from "crypto";

// Create admin Supabase client for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify webhook signature using Standard Webhooks spec
function verifySignature(
  payload: string,
  headers: {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
  }
): boolean {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) {
    console.error("DODO_PAYMENTS_WEBHOOK_KEY not configured");
    return false;
  }

  // Extract base64-encoded secret (remove 'whsec_' prefix if present)
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(secretKey, "base64");

  // Create signed content
  const signedContent = `${headers["webhook-id"]}.${headers["webhook-timestamp"]}.${payload}`;

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Parse signatures from header (format: v1,signature v1,signature2 ...)
  const signatures = headers["webhook-signature"]
    .split(" ")
    .map((sig) => sig.split(",")[1]);

  // Check if any signature matches
  return signatures.some((sig) => sig === expectedSignature);
}

// Map product IDs to storage limits
function getStorageLimitByProductId(productId: string): number {
  const planEntry = getPlanByProductId(productId);
  if (planEntry) {
    return planEntry[1].storage;
  }
  // Default to starter plan storage if not found
  return PLANS.starter.storage;
}

// Map product ID to plan name for subscription tier
function getPlanNameByProductId(productId: string): string {
  const planEntry = getPlanByProductId(productId);
  if (planEntry) {
    return planEntry[0]; // starter, growth, scale, enterprise
  }
  return "starter";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headers = {
      "webhook-id": request.headers.get("webhook-id") || "",
      "webhook-timestamp": request.headers.get("webhook-timestamp") || "",
      "webhook-signature": request.headers.get("webhook-signature") || "",
    };

    // Verify signature (skip in development if no key set)
    if (process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
      if (!verifySignature(payload, headers)) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    console.log("Webhook event received:", event.type);

    // Handle different event types
    switch (event.type) {
      case "subscription.active":
      case "subscription.created": {
        await handleSubscriptionActive(event.data);
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        await handleSubscriptionCancelled(event.data);
        break;
      }

      case "payment.succeeded": {
        // Log successful payment
        console.log("Payment succeeded:", event.data.payment_id);
        break;
      }

      case "payment.failed": {
        console.log("Payment failed:", event.data);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActive(data: {
  subscription_id: string;
  customer: { customer_id: string; email: string; name?: string };
  product_id: string;
  metadata?: { user_id?: string; plan_name?: string };
}) {
  console.log("Processing subscription active:", data);

  // Get user_id from metadata or find by email
  let userId = data.metadata?.user_id;

  if (!userId && data.customer?.email) {
    // Find user by email
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", data.customer.email)
      .single();

    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    console.error("Could not find user for subscription:", data);
    return;
  }

  const storageLimitBytes = getStorageLimitByProductId(data.product_id);
  const planName = getPlanNameByProductId(data.product_id);

  // Map plan name to subscription_tier enum
  const tierMap: Record<string, string> = {
    starter: "starter",
    growth: "pro",
    scale: "business",
    enterprise: "business",
  };
  const tier = tierMap[planName] || "starter";

  // Update user's storage limit
  const { error: userError } = await supabaseAdmin
    .from("users")
    .update({
      storage_limit_bytes: storageLimitBytes,
      // Unlimited bandwidth for all paid plans
      bandwidth_limit_bytes: 999999999999999, // ~909 PB (effectively unlimited)
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (userError) {
    console.error("Error updating user storage:", userError);
  }

  // Update or create subscription record
  const subscriptionData = {
    user_id: userId,
    tier,
    storage_limit_gb: Math.floor(storageLimitBytes / (1024 * 1024 * 1024)),
    bandwidth_limit_gb: 999999, // Effectively unlimited
    is_active: true,
    starts_at: new Date().toISOString(),
    expires_at: null, // Recurring subscription
    updated_at: new Date().toISOString(),
  };

  // First, deactivate any existing subscriptions
  await supabaseAdmin
    .from("subscriptions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_active", true);

  // Create new subscription
  const { error: subError } = await supabaseAdmin
    .from("subscriptions")
    .insert(subscriptionData);

  if (subError) {
    console.error("Error creating subscription:", subError);
  }

  console.log(`Subscription activated for user ${userId}, plan: ${planName}`);
}

async function handleSubscriptionCancelled(data: {
  subscription_id: string;
  customer: { customer_id: string; email: string };
  metadata?: { user_id?: string };
}) {
  console.log("Processing subscription cancellation:", data);

  let userId = data.metadata?.user_id;

  if (!userId && data.customer?.email) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", data.customer.email)
      .single();

    if (user) {
      userId = user.id;
    }
  }

  if (!userId) {
    console.error("Could not find user for cancellation:", data);
    return;
  }

  // Revert to free tier limits
  const { error: userError } = await supabaseAdmin
    .from("users")
    .update({
      storage_limit_bytes: 10 * 1024 * 1024 * 1024, // 10GB free
      bandwidth_limit_bytes: 100 * 1024 * 1024 * 1024, // 100GB free
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (userError) {
    console.error("Error reverting user storage:", userError);
  }

  // Deactivate subscription
  const { error: subError } = await supabaseAdmin
    .from("subscriptions")
    .update({
      is_active: false,
      expires_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (subError) {
    console.error("Error deactivating subscription:", subError);
  }

  // Create free subscription
  await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    tier: "free",
    storage_limit_gb: 10,
    bandwidth_limit_gb: 100,
    is_active: true,
    starts_at: new Date().toISOString(),
  });

  console.log(`Subscription cancelled for user ${userId}, reverted to free`);
}
