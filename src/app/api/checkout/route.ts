import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode",
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

    // Create checkout session
    const checkout = await client.payments.create({
      billing: {
        city: body.billing?.city || "Unknown",
        country: body.billing?.country || "US",
        state: body.billing?.state || "Unknown",
        street: body.billing?.street || "Unknown",
        zipcode: body.billing?.zipcode || "00000",
      },
      customer: {
        email: body.customer?.email || "",
        name: body.customer?.name || "Customer",
      },
      product_cart: body.product_cart.map((item: { product_id: string; quantity: number }) => ({
        product_id: item.product_id,
        quantity: item.quantity || 1,
      })),
      return_url: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
      metadata: body.metadata || {},
    });

    return NextResponse.json({
      checkout_url: checkout.payment_link,
      payment_id: checkout.payment_id,
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

    const checkout = await client.payments.create({
      billing: {
        city: "Unknown",
        country: "US",
        state: "Unknown",
        street: "Unknown",
        zipcode: "00000",
      },
      customer: {
        email: email || "",
        name: "Customer",
      },
      product_cart: [{ product_id: productId, quantity: 1 }],
      return_url: process.env.NEXT_PUBLIC_APP_URL + "/dashboard?subscription=success",
    });

    return NextResponse.json({
      checkout_url: checkout.payment_link,
      payment_id: checkout.payment_id,
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
