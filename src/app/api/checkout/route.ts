import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "live_mode",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.product_cart || !Array.isArray(body.product_cart) || body.product_cart.length === 0) {
      return NextResponse.json(
        { error: "product_cart is required" },
        { status: 400 }
      );
    }

    const productId = body.product_cart[0]?.product_id;

    // For subscription products, use subscriptions.create
    const subscription = await client.subscriptions.create({
      product_id: productId,
      quantity: 1,
      customer: {
        email: body.customer?.email || "",
        name: body.customer?.name || "Customer",
      },
      billing: {
        city: body.billing?.city || "Unknown",
        country: body.billing?.country || "US",
        state: body.billing?.state || "Unknown",
        street: body.billing?.street || "Unknown",
        zipcode: body.billing?.zipcode || "00000",
      },
      return_url: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
      payment_link: true,
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      checkout_url: subscription.payment_link,
      subscription_id: subscription.subscription_id,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    // Return proper JSON error
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// GET endpoint for simple product checkout links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const email = searchParams.get("email");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const subscription = await client.subscriptions.create({
      product_id: productId,
      quantity: 1,
      customer: {
        email: email || "",
        name: "Customer",
      },
      billing: {
        city: "Unknown",
        country: "US",
        state: "Unknown",
        street: "Unknown",
        zipcode: "00000",
      },
      return_url: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
      payment_link: true,
    });

    return NextResponse.json({
      checkout_url: subscription.payment_link,
      subscription_id: subscription.subscription_id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
