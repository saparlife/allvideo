import Link from "next/link";

export default function ChannelNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Channel not found
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          The channel you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Home
          </Link>
          <Link
            href="/channels"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Browse Channels
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 max-w-md mx-auto">
          <p className="text-sm text-gray-500 mb-4">You might want to:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              Check if the channel name is spelled correctly
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <Link href="/search" className="text-indigo-600 hover:underline">
                Search for the channel
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <Link href="/trending" className="text-indigo-600 hover:underline">
                Discover trending content
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
