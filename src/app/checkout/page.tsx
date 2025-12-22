"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanKey } from "@/lib/subscriptions";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planName = searchParams.get("plan") as PlanKey | null;

  useEffect(() => {
    async function initiateCheckout() {
      if (!planName || !PLANS[planName]) {
        setError("Invalid plan selected");
        setLoading(false);
        return;
      }

      const plan = PLANS[planName];
      const supabase = createClient();

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/checkout?plan=${planName}`);
        return;
      }

      try {
        // Create checkout session
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_cart: [
              { product_id: plan.productId, quantity: 1 }
            ],
            customer: {
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
            },
            metadata: {
              user_id: user.id,
              plan_name: planName,
            },
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          setError("Failed to create checkout session");
          setLoading(false);
        }
      } catch (err) {
        console.error("Checkout error:", err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }

    initiateCheckout();
  }, [planName, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#030306] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Checkout Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  const plan = planName ? PLANS[planName] : null;

  return (
    <div className="min-h-screen bg-[#030306] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">
          Preparing Checkout
        </h1>
        {plan && (
          <p className="text-gray-400">
            {plan.name} Plan - ${plan.price}/mo
          </p>
        )}
        <p className="text-gray-500 text-sm mt-4">
          Redirecting to secure payment...
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#030306] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">Loading...</h1>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}
