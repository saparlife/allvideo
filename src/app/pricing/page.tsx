import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    storage: "10 GB",
    features: ["10 GB storage", "100 GB bandwidth/mo", "720p transcoding", "API access"],
    popular: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/mo",
    storage: "100 GB",
    features: ["100 GB storage", "500 GB bandwidth/mo", "1080p transcoding", "API access", "Priority support"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$39",
    period: "/mo",
    storage: "500 GB",
    features: ["500 GB storage", "2 TB bandwidth/mo", "4K transcoding", "API access", "Priority support", "Custom player"],
    popular: true,
  },
  {
    name: "Business",
    price: "$149",
    period: "/mo",
    storage: "2 TB",
    features: ["2 TB storage", "10 TB bandwidth/mo", "4K transcoding", "API access", "Priority support", "Custom player", "White-label"],
    popular: false,
  },
];

const enterprisePlans = [
  { name: "Scale", price: "$749", storage: "10 TB" },
  { name: "Enterprise", price: "$1,499", storage: "20 TB" },
  { name: "Enterprise+", price: "$3,749", storage: "50 TB" },
  { name: "Ultimate", price: "$7,499", storage: "100 TB" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AllVideo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400">
            Start free, upgrade when you need more
          </p>
        </div>

        {/* Main Plans */}
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-gray-800/50 rounded-xl p-6 border ${
                plan.popular ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-700"
              } relative`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-400 mt-2">{plan.storage} storage</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-6 ${plan.popular ? "" : "bg-gray-700 hover:bg-gray-600"}`}
                asChild
              >
                <Link href="/register">
                  {plan.price === "$0" ? "Start Free" : "Get Started"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Enterprise Plans */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Enterprise Plans
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {enterprisePlans.map((plan) => (
              <div
                key={plan.name}
                className="bg-gray-800/30 rounded-lg p-5 border border-gray-800 text-center"
              >
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{plan.price}<span className="text-sm text-gray-400">/mo</span></p>
                <p className="text-gray-400 text-sm mt-1">{plan.storage} storage</p>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/register">Contact Sales</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or additional info */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <p className="text-gray-400">
            All plans include unlimited bandwidth with Cloudflare CDN, automatic HLS transcoding,
            and API access. Need a custom plan?{" "}
            <a href="mailto:hello@allvideo.one" className="text-blue-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            <span className="text-gray-400">AllVideo.one</span>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AllVideo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
