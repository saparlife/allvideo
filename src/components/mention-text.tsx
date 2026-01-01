"use client";

import Link from "next/link";

interface MentionTextProps {
  text: string;
  className?: string;
}

// Parse @username mentions and convert to links
export function MentionText({ text, className = "" }: MentionTextProps) {
  // Regex to match @username (alphanumeric and underscores)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the mention as a link
    const username = match[1];
    parts.push(
      <Link
        key={`${match.index}-${username}`}
        href={`/channel/${username}`}
        className="text-indigo-600 hover:text-indigo-700 font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
