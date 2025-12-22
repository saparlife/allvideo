"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Infinity, Zap, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    storage: "50 GB",
    features: [
      "50 GB storage",
      "Unlimited bandwidth",
      "1080p transcoding",
      "HLS adaptive streaming",
      "Global CDN",
      "API access",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "$79",
    storage: "200 GB",
    features: [
      "200 GB storage",
      "Unlimited bandwidth",
      "1080p transcoding",
      "HLS adaptive streaming",
      "Global CDN",
      "API access",
      "Analytics dashboard",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "$199",
    storage: "1 TB",
    features: [
      "1 TB storage",
      "Unlimited bandwidth",
      "1080p transcoding",
      "HLS adaptive streaming",
      "Global CDN",
      "API access",
      "Advanced analytics",
      "Priority support",
      "Custom player branding",
    ],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$499",
    storage: "5 TB",
    features: [
      "5 TB storage",
      "Unlimited bandwidth",
      "1080p transcoding",
      "HLS adaptive streaming",
      "Global CDN",
      "API access",
      "Advanced analytics",
      "Dedicated support",
      "White-label player",
      "SLA guarantee",
    ],
    popular: false,
  },
];

const faqs = [
  {
    q: "Is bandwidth really unlimited?",
    a: "Yes. We use Cloudflare R2 with free egress. Whether your videos get 1,000 or 1,000,000 views, you pay the same monthly price. No overage charges, ever."
  },
  {
    q: "How does this compare to Vimeo?",
    a: "Vimeo charges $2,700/year for just 30TB of bandwidth. Our Growth plan at $79/month gives you unlimited bandwidth — that's potentially $10,000+ in savings per year."
  },
  {
    q: "What video formats do you support?",
    a: "Upload any format (MP4, MOV, AVI, MKV, etc). We automatically transcode to HLS with adaptive bitrate streaming (360p to 1080p)."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel anytime and your videos remain accessible until the end of your billing period."
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#030306] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">UnlimVideo</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 font-medium">
              <Link href="/pricing">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
            <Infinity className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-gray-300">Unlimited bandwidth on all plans</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Simple, predictable
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              pricing
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Stop paying for views. Get unlimited bandwidth with every plan.
            Save thousands compared to Vimeo.
          </p>
        </div>

        {/* Comparison Banner */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-violet-600/20 rounded-2xl blur-xl" />
            <div className="relative bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vimeo charges for overages</p>
                  <p className="text-lg font-semibold">50TB/month = <span className="text-red-400">$10,000+/year</span></p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div className="text-center md:text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Same on UnlimVideo</p>
                  <p className="text-lg font-semibold">50TB/month = <span className="text-emerald-400">$0 extra</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-24">
          {plans.map((plan) => (
            <div key={plan.name} className={`group relative ${plan.popular ? 'lg:scale-105 lg:z-10' : ''}`}>
              {plan.popular && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-50" />
              )}
              <div className={`relative h-full bg-[#0A0A0F] rounded-2xl p-6 border ${plan.popular ? 'border-violet-500/50' : 'border-white/10'} transition-all duration-300 hover:border-white/20`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{plan.storage} storage</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Infinity className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Unlimited bandwidth</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700' : 'bg-white/10 hover:bg-white/20'} font-medium`}
                  asChild
                >
                  <Link href={plan.name === "Enterprise" ? "mailto:hello@unlimvideo.com" : `/checkout?plan=${plan.name.toLowerCase()}`}>
                    {plan.name === "Enterprise" ? "Contact Sales" : "Subscribe"}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-24">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-[#0A0A0F] border border-white/10 rounded-xl p-6 transition-all duration-300 hover:border-white/20">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-400 mb-6">
            Need a custom plan or have questions?
          </p>
          <Button asChild className="bg-white/10 hover:bg-white/20 font-medium">
            <a href="mailto:hello@unlimvideo.com">Contact Sales</a>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">UnlimVideo</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                Home
              </Link>
              <a href="mailto:hello@unlimvideo.com" className="text-sm text-gray-500 hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} UnlimVideo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
