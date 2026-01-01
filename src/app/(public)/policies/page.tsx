import { Metadata } from "next";
import Link from "next/link";
import { Shield, AlertTriangle, Ban, CheckCircle, FileText, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Community Guidelines & Content Policies",
  description: "Learn about our content policies, community guidelines, and what content is allowed on UnlimVideo.",
};

export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Community Guidelines & Content Policies
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Our policies are designed to keep UnlimVideo safe and enjoyable for everyone.
          Please read them carefully before uploading content.
        </p>
      </div>

      {/* Quick Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-green-900 mb-2">What's Allowed</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Original content you created</li>
            <li>• Educational videos</li>
            <li>• Entertainment content</li>
            <li>• Reviews and commentary</li>
            <li>• Licensed content</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-yellow-900 mb-2">Age-Restricted</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Mature language</li>
            <li>• Violence in context</li>
            <li>• Controversial topics</li>
            <li>• Drug references in art</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <Ban className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="font-semibold text-red-900 mb-2">Never Allowed</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Hate speech</li>
            <li>• Harassment & bullying</li>
            <li>• Violence & threats</li>
            <li>• Sexual content</li>
            <li>• Copyright infringement</li>
          </ul>
        </div>
      </div>

      {/* Detailed Policies */}
      <div className="space-y-8">
        {/* Hate Speech */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">1</span>
            Hate Speech & Discrimination
          </h2>
          <p className="text-gray-600 mb-4">
            We do not allow content that promotes hatred, violence, or discrimination against individuals or groups based on:
          </p>
          <ul className="text-gray-600 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Race, ethnicity, or national origin
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Religion or belief
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Gender, gender identity, or sexual orientation
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Disability or medical condition
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Violation of this policy may result in immediate account termination.
          </p>
        </section>

        {/* Harassment */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">2</span>
            Harassment & Bullying
          </h2>
          <p className="text-gray-600 mb-4">
            We don't tolerate harassment of any kind. This includes:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Personal attacks or insults
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Doxxing or sharing private information
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Stalking or unwanted contact
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Coordinated attacks on individuals
            </li>
          </ul>
        </section>

        {/* Violence */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">3</span>
            Violence & Dangerous Content
          </h2>
          <p className="text-gray-600 mb-4">
            We prohibit content that:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Promotes or glorifies violence
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Contains graphic violence or gore
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Provides instructions for harmful activities
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Threatens real-world violence
            </li>
          </ul>
        </section>

        {/* Sexual Content */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold">4</span>
            Sexual Content
          </h2>
          <p className="text-gray-600 mb-4">
            We do not allow sexually explicit content, including:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Pornography or sexually explicit material
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Non-consensual sexual content
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">•</span>
              Sexual content involving minors (zero tolerance)
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Educational or artistic content may be allowed with appropriate age restrictions.
          </p>
        </section>

        {/* Copyright */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">5</span>
            Copyright & Intellectual Property
          </h2>
          <p className="text-gray-600 mb-4">
            Respect intellectual property rights:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Only upload content you own or have rights to use
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Fair use may apply for commentary, criticism, or education
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              Repeated violations may result in account termination
            </li>
          </ul>
        </section>

        {/* Spam */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-bold">6</span>
            Spam & Deceptive Practices
          </h2>
          <p className="text-gray-600 mb-4">
            We don't allow:
          </p>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Misleading titles, thumbnails, or descriptions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Spam or artificially inflated engagement
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Scams or phishing attempts
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              Impersonation of others
            </li>
          </ul>
        </section>
      </div>

      {/* Enforcement */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-gray-600" />
          How We Enforce These Policies
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Content Removal</h3>
            <p className="text-sm text-gray-600">
              Content that violates our policies will be removed. Creators will be notified and can appeal if they believe the removal was a mistake.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Strikes System</h3>
            <p className="text-sm text-gray-600">
              Violations result in strikes. Three strikes may lead to channel termination. Severe violations may result in immediate termination.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Age Restrictions</h3>
            <p className="text-sm text-gray-600">
              Some content may be age-restricted rather than removed if it's borderline or educational in nature.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Appeals</h3>
            <p className="text-sm text-gray-600">
              You can appeal content removal decisions. Our team reviews appeals within 7 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
        <Users className="w-10 h-10 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">See Something? Say Something.</h2>
        <p className="text-gray-600 mb-4">
          Help us keep the community safe by reporting content that violates these policies.
          Look for the report button on any video, comment, or channel.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Last updated */}
      <p className="text-center text-sm text-gray-500 mt-8">
        Last updated: January 2026
      </p>
    </div>
  );
}
