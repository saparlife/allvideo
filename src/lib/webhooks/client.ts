import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import type { WebhookEventType } from "@/types/database";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

interface DeliveryResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  durationMs: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Deliver webhook to a single endpoint
 */
async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<DeliveryResult> {
  const supabase = createAdminClient();
  const payloadStr = JSON.stringify(payload);
  const signature = generateSignature(payloadStr, secret);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const durationMs = Date.now() - startTime;
    const responseBody = await response.text().catch(() => "");

    // Record delivery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: payload.event,
      payload: payload,
      response_status: response.status,
      response_body: responseBody.slice(0, 1000), // Limit response body size
      duration_ms: durationMs,
      success: response.ok,
      attempt,
    });

    // Update webhook last triggered
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("webhooks")
      .update({
        last_triggered_at: new Date().toISOString(),
        failure_count: response.ok ? 0 : undefined,
      })
      .eq("id", webhookId);

    if (!response.ok) {
      // Increment failure count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc("increment_webhook_failure", {
        webhook_id: webhookId,
      });
    }

    return {
      webhookId,
      success: response.ok,
      statusCode: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Record failed delivery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: payload.event,
      payload: payload,
      response_body: errorMessage,
      duration_ms: durationMs,
      success: false,
      attempt,
    });

    return {
      webhookId,
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Deliver webhook with retries
 */
async function deliverWithRetry(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<DeliveryResult> {
  let lastResult: DeliveryResult | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    lastResult = await deliverWebhook(webhookId, url, secret, payload, attempt);

    if (lastResult.success) {
      return lastResult;
    }

    // Wait before retry (except on last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
    }
  }

  return lastResult!;
}

/**
 * Trigger webhooks for a user's event
 */
export async function triggerWebhooks(
  userId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<DeliveryResult[]> {
  const supabase = createAdminClient();

  // Get all active webhooks for this user that subscribe to this event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: webhooks, error } = await (supabase as any)
    .from("webhooks")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .contains("events", [event]);

  if (error || !webhooks || webhooks.length === 0) {
    return [];
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Deliver to all webhooks in parallel (don't wait in API context)
  const results = await Promise.all(
    webhooks.map((webhook: { id: string; url: string; secret: string }) =>
      deliverWithRetry(webhook.id, webhook.url, webhook.secret, payload)
    )
  );

  return results;
}

/**
 * Trigger webhooks in background (fire and forget for API responses)
 */
export function triggerWebhooksAsync(
  userId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): void {
  // Fire and forget - don't await
  triggerWebhooks(userId, event, data).catch((err) => {
    console.error("Webhook delivery error:", err);
  });
}

/**
 * Generate a random webhook secret
 */
export function generateWebhookSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Verify webhook signature (for clients receiving webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return signature === expectedSignature;
}
