"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Video, Image, Music, FileText, Code, Terminal } from "lucide-react";

function FeatureCard({ icon: Icon, title, description, code }: {
  icon: React.ElementType;
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
        <code className="text-xs text-green-400 whitespace-pre">{code}</code>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">1stream</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/register">Get API Key</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="container mx-auto px-6 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-2 mb-8">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-indigo-700 font-medium">Built for developers</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900">
              One API for all
              <br />
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                your media needs
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Video, images, audio, files. Upload once, get optimized URLs.
              <br />
              Stop writing media handling code for every project.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8">
                <Link href="/register">
                  Get Free API Key
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/docs">
                  <Code className="w-4 h-4 mr-2" />
                  View Docs
                </Link>
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              1GB free storage. No credit card required.
            </p>
          </div>
        </section>

        {/* Code Example */}
        <section className="container mx-auto px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-500 text-sm ml-2">Upload any media</span>
              </div>
              <pre className="text-sm overflow-x-auto">
                <code className="text-gray-300">{`curl -X POST https://api.1stream.dev/v1/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@video.mp4" \\
  -F 'metadata={"userId": "123", "projectId": "abc"}'

# Response
{
  "id": "med_x7k9m2",
  "type": "video",
  "status": "ready",
  "hls_url": "https://cdn.1stream.dev/med_x7k9m2/master.m3u8",
  "thumbnail": "https://cdn.1stream.dev/med_x7k9m2/thumb.jpg",
  "metadata": {"userId": "123", "projectId": "abc"}
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">All media types. One API.</h2>
            <p className="text-gray-600">Upload anything, get optimized URLs back</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FeatureCard
              icon={Video}
              title="Video"
              description="Auto HLS transcoding. Multiple qualities (360p-1080p). Thumbnail generation."
              code={`POST /v1/videos
→ hls_url, thumbnail, duration`}
            />
            <FeatureCard
              icon={Image}
              title="Images"
              description="Auto resize & compress. WebP/AVIF conversion. Multiple variants."
              code={`POST /v1/images?variants=thumb,medium
→ original, variants[], dominant_color`}
            />
            <FeatureCard
              icon={Music}
              title="Audio"
              description="Convert to MP3. Waveform generation. Metadata extraction."
              code={`POST /v1/audio
→ stream_url, waveform, duration`}
            />
            <FeatureCard
              icon={FileText}
              title="Files"
              description="Any file type. PDF preview. Signed URLs with expiration."
              code={`POST /v1/files
→ url, signed_url, preview_url`}
            />
          </div>
        </section>

        {/* Custom Metadata */}
        <section className="container mx-auto px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Your metadata, your way</h2>
              <p className="text-gray-600 mb-6">
                Attach any custom data to your uploads. Query by metadata later.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Upload with metadata</p>
                  <pre className="text-xs text-gray-600 overflow-x-auto">{`{
  "file": <binary>,
  "metadata": {
    "companyId": "comp_123",
    "userId": "user_456",
    "folder": "avatars"
  }
}`}</pre>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Query by metadata</p>
                  <pre className="text-xs text-gray-600 overflow-x-auto">{`GET /v1/media
  ?companyId=comp_123
  &userId=user_456
  &type=image

→ All images for this user`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="container mx-auto px-6 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Simple pricing</h2>
            <p className="text-gray-600">Pay for storage, not API calls</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Free</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$0</p>
              <p className="text-sm text-gray-500 mb-4">1GB storage</p>
              <p className="text-xs text-gray-400">100 uploads/day</p>
            </div>
            <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">Popular</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pro</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$9<span className="text-sm font-normal">/mo</span></p>
              <p className="text-sm text-gray-500 mb-4">100GB storage</p>
              <p className="text-xs text-gray-400">Unlimited uploads</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Business</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">$29<span className="text-sm font-normal">/mo</span></p>
              <p className="text-sm text-gray-500 mb-4">1TB storage</p>
              <p className="text-xs text-gray-400">Webhooks + Priority</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Start building</h2>
            <p className="text-gray-600 mb-8">
              Get your API key and upload your first file in 30 seconds.
            </p>
            <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8">
              <Link href="/register">
                Get Free API Key
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-gray-900">1stream</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} 1stream.dev
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
