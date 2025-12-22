import { Checkout } from "@dodopayments/nextjs";

// Static checkout via GET - for direct product links
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" || "test_mode",
  type: "static",
});

// Dynamic checkout via POST - for checkout sessions
export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" || "test_mode",
  type: "session",
});
