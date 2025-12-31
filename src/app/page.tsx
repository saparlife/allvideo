"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap, Globe, Play, Infinity, ArrowRight, Sparkles,
  Check, Shield, Clock, BarChart3, Code, Users,
  ChevronDown, Star
} from "lucide-react";
import { useState, useEffect } from "react";

// Pricing data
const plans = [
  {
    name: "Free",
    price: "$0",
    storage: "10 GB",
    features: ["Unlimited bandwidth", "1080p transcoding", "Global CDN", "Basic analytics", "Community support"],
    cta: "Get Started",
    href: "/register",
  },
  {
    name: "Starter",
    price: "$29",
    storage: "50 GB",
    features: ["Everything in Free", "Priority transcoding", "Custom player branding", "API access", "Email support"],
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    name: "Growth",
    price: "$79",
    storage: "200 GB",
    popular: true,
    features: ["Everything in Starter", "Advanced analytics", "Multiple team members", "Webhook integrations", "Priority support"],
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    name: "Scale",
    price: "$199",
    storage: "1 TB",
    features: ["Everything in Growth", "White-label player", "Custom domain", "SLA guarantee", "Dedicated support"],
    cta: "Start Free Trial",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: "Custom",
    storage: "Unlimited",
    features: ["Everything in Scale", "Custom integrations", "On-premise option", "24/7 phone support", "Custom contracts"],
    cta: "Contact Sales",
    href: "mailto:hello@lovsell.com",
  },
];

// FAQ data
const faqs = [
  {
    q: "Is bandwidth really unlimited?",
    a: "Yes, 100%. We use enterprise-grade CDN infrastructure with zero egress fees. Whether your videos get 1,000 or 1,000,000 views, you pay the same monthly price. No overage charges, ever."
  },
  {
    q: "What's included in the free plan?",
    a: "The free plan includes 10GB storage, unlimited bandwidth, 1080p transcoding, and global CDN delivery. No credit card required. Perfect for trying the service or small projects."
  },
  {
    q: "How does this compare to Vimeo?",
    a: "Vimeo charges $2,700/year for just 30TB of bandwidth. Our Growth plan at $79/month gives you unlimited bandwidth — that's potentially $10,000+ in savings per year."
  },
  {
    q: "What video formats do you support?",
    a: "Upload any format (MP4, MOV, AVI, MKV, WebM, and more). We automatically transcode to HLS with adaptive bitrate streaming (360p to 1080p) for optimal playback on any device."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel anytime and your videos remain accessible until the end of your billing period. We believe in earning your business every month."
  },
  {
    q: "Do you offer an API?",
    a: "Yes! Full REST API for uploading, managing, and streaming videos programmatically. Perfect for integrating video into your app or automating workflows."
  }
];

// Stats
const stats = [
  { value: "10M+", label: "Videos Delivered" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "150+", label: "Edge Locations" },
  { value: "50ms", label: "Avg. Latency" },
];

function SavingsCalculator() {
  const [bandwidth, setBandwidth] = useState(50);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const vimeoBaseCost = bandwidth <= 2 ? 33 : bandwidth <= 30 ? 225 : 225 + (bandwidth - 30) * 90;
  const vimeoYearlyCost = vimeoBaseCost * 12;
  const unlimVideoCost = bandwidth <= 50 ? 79 : bandwidth <= 200 ? 199 : 499;
  const unlimVideoYearlyCost = unlimVideoCost * 12;
  const savings = vimeoYearlyCost - unlimVideoYearlyCost;
  const savingsPercent = Math.round((savings / vimeoYearlyCost) * 100);

  return (
    <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Calculate Your Savings</h3>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-sm text-gray-500">Monthly bandwidth usage</span>
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {bandwidth} <span className="text-lg font-normal text-gray-500">TB</span>
            </span>
          </div>

          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-150"
              style={{ width: `${((bandwidth - 5) / 195) * 100}%` }}
            />
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={bandwidth}
              onChange={(e) => setBandwidth(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full shadow-lg transition-all duration-150 pointer-events-none"
              style={{ left: `calc(${((bandwidth - 5) / 195) * 100}% - 12px)` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <p className="text-xs text-red-600 uppercase tracking-wider font-semibold mb-1">Vimeo Pro</p>
            <p className="text-3xl font-bold text-red-600">${vimeoYearlyCost.toLocaleString()}<span className="text-sm font-normal text-red-400">/yr</span></p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">UnlimVideo</p>
            <p className="text-3xl font-bold text-emerald-600">${unlimVideoYearlyCost.toLocaleString()}<span className="text-sm font-normal text-emerald-400">/yr</span></p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-center">
          <p className="text-xs text-indigo-100 uppercase tracking-wider font-semibold mb-1">Your Annual Savings</p>
          <p className="text-4xl font-bold text-white">${savings.toLocaleString()}</p>
          <p className="text-sm text-indigo-100 mt-1">{savingsPercent}% less than Vimeo</p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="w-full py-6 flex items-center justify-between text-left cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors pr-8">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">UnlimVideo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              Pricing
            </Link>
            <Link href="#faq" className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              FAQ
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 cursor-pointer">
              <Link href="/register">Start Free</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="container mx-auto px-6">
            <div className={`max-w-5xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 mb-8 shadow-lg shadow-gray-200/50">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">Trusted by 1,000+ creators</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
                <span className="text-gray-900">Video hosting</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  without limits
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Unlimited bandwidth. One price. No surprises.
                <span className="block mt-2 text-gray-500">Save up to 90% compared to Vimeo.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold h-14 px-10 text-lg shadow-xl shadow-indigo-500/30 cursor-pointer">
                  <Link href="/register">
                    Start Free — No Credit Card
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  10GB free storage
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Unlimited bandwidth
                </span>
                <span className="hidden sm:flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  No credit card
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 border-y border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Stop overpaying for bandwidth</h2>
                <p className="text-xl text-gray-600">See how we compare to the competition</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 shadow-xl">
                <div className="grid md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">Vimeo Pro</p>
                    <p className="text-5xl font-bold text-gray-300 line-through">$2,700</p>
                    <p className="text-sm text-gray-400 mt-1">per year for 30TB</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                      <span className="text-xl font-bold text-white">VS</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-indigo-600 uppercase tracking-wider mb-2 font-semibold">UnlimVideo</p>
                    <p className="text-5xl font-bold text-gray-900">$948</p>
                    <p className="text-sm text-emerald-600 font-medium mt-1">Unlimited bandwidth</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500">
                    That&apos;s <span className="text-2xl font-bold text-emerald-500">$1,752</span> saved per year — and no bandwidth limits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Everything you need</h2>
              <p className="text-xl text-gray-600">Professional video hosting at a fraction of the cost</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { icon: Infinity, title: "Unlimited Bandwidth", desc: "No caps, no overages. Your videos can go viral without breaking the bank.", color: "from-indigo-500 to-purple-500" },
                { icon: Globe, title: "Global CDN", desc: "150+ edge locations worldwide. Lightning-fast delivery everywhere.", color: "from-emerald-500 to-teal-500" },
                { icon: Play, title: "Auto HLS Transcoding", desc: "Upload any format. We convert to adaptive streaming automatically.", color: "from-orange-500 to-rose-500" },
                { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant. Signed URLs, domain restrictions, and more.", color: "from-blue-500 to-cyan-500" },
                { icon: Code, title: "Developer-First API", desc: "Full REST API for uploads, management, and analytics.", color: "from-violet-500 to-purple-500" },
                { icon: BarChart3, title: "Real-time Analytics", desc: "Views, engagement, geography, and device breakdowns.", color: "from-pink-500 to-rose-500" },
              ].map((feature) => (
                <div key={feature.title} className="group bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900">
                  See your
                  <span className="block bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">actual savings</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Drag the slider to calculate how much you could save by switching from Vimeo to UnlimVideo.
                </p>
                <div className="space-y-4">
                  {[
                    "No bandwidth limits or overage fees",
                    "Predictable monthly pricing",
                    "Same features, fraction of the cost"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <SavingsCalculator />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Get started in minutes</h2>
              <p className="text-xl text-gray-600">Three simple steps to unlimited video streaming</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { step: "01", title: "Upload", desc: "Drag & drop any video format. MP4, MOV, AVI, MKV — we handle it all.", icon: Clock },
                { step: "02", title: "Transcode", desc: "We automatically convert to HLS with multiple quality levels (360p-1080p).", icon: Sparkles },
                { step: "03", title: "Embed & Share", desc: "Get an embed code or use our API. Stream anywhere with unlimited views.", icon: Users },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-200 to-transparent" />
                  )}
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-3xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Simple, transparent pricing</h2>
              <p className="text-xl text-gray-600">All plans include unlimited bandwidth. Always.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative group ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                  )}
                  <div className={`relative h-full bg-white rounded-2xl p-6 border ${plan.popular ? 'border-indigo-300 shadow-xl' : 'border-gray-200'} hover:shadow-lg transition-all`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        {plan.price !== "Custom" && <span className="text-gray-500">/mo</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{plan.storage} storage</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Infinity className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm text-indigo-600 font-medium">Unlimited bandwidth</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={`w-full cursor-pointer ${
                        plan.popular
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-gray-50 scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">Frequently asked questions</h2>
                <p className="text-xl text-gray-600">Everything you need to know about UnlimVideo</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200 shadow-sm">
                {faqs.map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Still have questions?{" "}
                  <a href="mailto:hello@lovsell.com" className="text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
                    Contact us
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-12 md:p-20 text-center shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0xSC0xMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-20" />
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
                    Ready to save thousands?
                  </h2>
                  <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                    Join 1,000+ creators and businesses who switched to UnlimVideo.
                    Start free today — no credit card required.
                  </p>
                  <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold h-14 px-10 text-lg shadow-xl cursor-pointer">
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">UnlimVideo</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                FAQ
              </a>
              <a href="mailto:hello@lovsell.com" className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} UnlimVideo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
