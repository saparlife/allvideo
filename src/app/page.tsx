"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Globe, Play, Infinity, ArrowRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

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
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Savings Calculator</h3>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-sm text-gray-500">Monthly bandwidth</span>
            <span className="text-2xl font-bold text-gray-900">{bandwidth} <span className="text-sm font-normal text-gray-500">TB</span></span>
          </div>

          <div className="relative h-2 bg-gray-100 rounded-full">
            <div
              className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-150"
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
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full shadow-md transition-all duration-150 pointer-events-none"
              style={{ left: `calc(${((bandwidth - 5) / 195) * 100}% - 10px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>5 TB</span>
            <span>200 TB</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vimeo</p>
            <p className="text-2xl font-bold text-red-500">${vimeoYearlyCost.toLocaleString()}<span className="text-xs font-normal text-gray-500">/yr</span></p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">UnlimVideo</p>
            <p className="text-2xl font-bold text-emerald-500">${unlimVideoYearlyCost.toLocaleString()}<span className="text-xs font-normal text-gray-500">/yr</span></p>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your annual savings</p>
            <p className="text-3xl font-bold text-gray-900">${savings.toLocaleString()}</p>
            <p className="text-sm text-indigo-600 mt-1">{savingsPercent}% less than Vimeo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient }: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative">
      <div className="h-full bg-white border border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-300">
        <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PricingCard({ name, price, storage, popular = false }: {
  name: string;
  price: string;
  storage: string;
  popular?: boolean;
}) {
  return (
    <div className={`group relative ${popular ? 'scale-105' : ''}`}>
      {popular && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30" />
      )}
      <div className={`relative h-full bg-white rounded-2xl p-6 border ${popular ? 'border-indigo-300 shadow-lg' : 'border-gray-200'} transition-all duration-300 hover:shadow-md`}>
        {popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <div className="mt-2 mb-1">
          <span className="text-3xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-500">/mo</span>
        </div>
        <p className="text-sm text-gray-500">{storage} storage</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Infinity className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs text-indigo-600 font-medium">Unlimited bandwidth</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">UnlimVideo</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium">
              <Link href="/pricing">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-sm text-gray-600">Unlimited bandwidth on all plans</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900">
              Stop paying
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                for video views
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Video hosting with truly unlimited bandwidth. No overages, no surprises.
              Just one predictable monthly price.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium h-12 px-8 text-base">
                <Link href="/register">
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium h-12 px-8 text-base">
                <Link href="/pricing">
                  View Plans
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              10GB free storage included. No credit card required.
            </p>
          </div>
        </section>

        {/* Comparison */}
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="text-center md:text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Vimeo Pro</p>
                  <p className="text-4xl font-bold text-gray-900">$2,700<span className="text-lg font-normal text-gray-500">/yr</span></p>
                  <p className="text-sm text-gray-500 mt-1">for 30TB bandwidth</p>
                </div>

                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">VS</span>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">UnlimVideo</p>
                  <p className="text-4xl font-bold text-emerald-500">$948<span className="text-lg font-normal text-gray-500">/yr</span></p>
                  <p className="text-sm text-gray-500 mt-1">unlimited bandwidth</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Everything you need</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Professional video hosting without the enterprise price tag</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={Infinity}
              title="Unlimited Bandwidth"
              description="No caps, no overages. Your videos can go viral without breaking the bank. Pay the same for 1K or 1M views."
              gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
            />
            <FeatureCard
              icon={Globe}
              title="Global CDN"
              description="Powered by enterprise edge network. Lightning-fast video delivery to viewers anywhere in the world."
              gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon={Play}
              title="Auto HLS Transcoding"
              description="Upload any format. We convert to adaptive HLS with multiple quality levels (360p to 1080p) automatically."
              gradient="bg-gradient-to-br from-orange-500 to-rose-500"
            />
          </div>
        </section>

        {/* Calculator */}
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Calculate your savings</h2>
              <p className="text-gray-600">See how much you could save compared to Vimeo</p>
            </div>
            <SavingsCalculator />
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">How it works</h2>
            <p className="text-gray-600">Three simple steps to unlimited video streaming</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Upload", desc: "Upload any video format. MP4, MOV, AVI, MKV — we handle it all." },
              { step: "2", title: "Transcode", desc: "We automatically convert to HLS with multiple quality levels." },
              { step: "3", title: "Embed", desc: "Get an embed code or use our API. Stream anywhere, unlimited views." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="container mx-auto px-6 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Simple, predictable pricing</h2>
            <p className="text-gray-600">All plans include unlimited bandwidth</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <PricingCard name="Starter" price="$29" storage="50 GB" />
            <PricingCard name="Growth" price="$79" storage="200 GB" popular />
            <PricingCard name="Scale" price="$199" storage="1 TB" />
            <PricingCard name="Enterprise" price="$499" storage="5 TB" />
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-12 text-center shadow-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to stop overpaying?</h2>
              <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
                Join companies saving thousands on video hosting every year.
              </p>
              <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-medium h-12 px-8 text-base">
                <Link href="/pricing">
                  Choose Your Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">UnlimVideo</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Pricing
              </Link>
              <a href="mailto:hello@lovsell.com" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} UnlimVideo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
