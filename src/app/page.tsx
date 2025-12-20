import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Zap, Shield, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AllVideo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Video hosting
            <br />
            <span className="text-blue-500">made simple</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Upload, transcode, and stream your videos with adaptive HLS quality.
            Start free with 10GB storage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Auto Transcoding
            </h3>
            <p className="text-gray-400">
              Automatically convert videos to HLS with multiple quality levels (360p to 1080p).
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Global CDN
            </h3>
            <p className="text-gray-400">
              Deliver videos fast worldwide with Cloudflare&apos;s edge network.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Secure API
            </h3>
            <p className="text-gray-400">
              Integrate with your apps using API keys and signed URLs.
            </p>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400 mb-8">
            Start free, upgrade when you need more
          </p>
          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Free", storage: "10 GB", price: "$0" },
              { name: "Starter", storage: "100 GB", price: "$9/mo" },
              { name: "Pro", storage: "500 GB", price: "$29/mo" },
              { name: "Business", storage: "2 TB", price: "$79/mo" },
            ].map((plan) => (
              <div
                key={plan.name}
                className="bg-gray-800/30 rounded-lg p-6 border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{plan.price}</p>
                <p className="text-gray-400 text-sm mt-1">{plan.storage} storage</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-12 border-t border-gray-800">
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
