"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

// Custom bash/curl syntax highlighter
function highlightBash(code: string): React.ReactNode[] {
  const lines = code.split('\n');

  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Highlight curl command
    if (remaining.startsWith('curl ') || remaining.match(/^\s*curl /)) {
      const curlMatch = remaining.match(/^(\s*)(curl)/);
      if (curlMatch) {
        if (curlMatch[1]) parts.push(<span key={keyIndex++} className="text-gray-300">{curlMatch[1]}</span>);
        parts.push(<span key={keyIndex++} className="text-cyan-400">{curlMatch[2]}</span>);
        remaining = remaining.slice(curlMatch[0].length);
      }
    }

    // Highlight comments
    if (remaining.startsWith('#') || remaining.match(/^\s*#/)) {
      parts.push(<span key={keyIndex++} className="text-gray-500">{remaining}</span>);
      return <div key={lineIndex}>{parts}</div>;
    }

    // Process rest of the line
    let i = 0;
    while (i < remaining.length) {
      // HTTP methods
      const methodMatch = remaining.slice(i).match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/);
      if (methodMatch) {
        parts.push(<span key={keyIndex++} className="text-yellow-400">{methodMatch[1]}</span>);
        i += methodMatch[1].length;
        continue;
      }

      // URLs
      const urlMatch = remaining.slice(i).match(/^(https?:\/\/[^\s"']+)/);
      if (urlMatch) {
        parts.push(<span key={keyIndex++} className="text-green-400">{urlMatch[1]}</span>);
        i += urlMatch[1].length;
        continue;
      }

      // Double quoted strings
      if (remaining[i] === '"') {
        let end = i + 1;
        while (end < remaining.length && remaining[end] !== '"') {
          if (remaining[end] === '\\') end++;
          end++;
        }
        end++; // include closing quote
        parts.push(<span key={keyIndex++} className="text-orange-300">{remaining.slice(i, end)}</span>);
        i = end;
        continue;
      }

      // Single quoted strings
      if (remaining[i] === "'") {
        let end = i + 1;
        while (end < remaining.length && remaining[end] !== "'") end++;
        end++; // include closing quote
        parts.push(<span key={keyIndex++} className="text-orange-300">{remaining.slice(i, end)}</span>);
        i = end;
        continue;
      }

      // Flags like -X, -H, -F, -d
      const flagMatch = remaining.slice(i).match(/^(-[A-Za-z]+)/);
      if (flagMatch) {
        parts.push(<span key={keyIndex++} className="text-purple-400">{flagMatch[1]}</span>);
        i += flagMatch[1].length;
        continue;
      }

      // Default - add character as gray
      const nextSpecial = remaining.slice(i).search(/[-"'A-Z]|https?:\/\//);
      if (nextSpecial > 0) {
        parts.push(<span key={keyIndex++} className="text-gray-300">{remaining.slice(i, i + nextSpecial)}</span>);
        i += nextSpecial;
      } else if (nextSpecial === -1) {
        parts.push(<span key={keyIndex++} className="text-gray-300">{remaining.slice(i)}</span>);
        break;
      } else {
        parts.push(<span key={keyIndex++} className="text-gray-300">{remaining[i]}</span>);
        i++;
      }
    }

    return <div key={lineIndex}>{parts.length > 0 ? parts : '\u00A0'}</div>;
  });
}

export function CodeBlock({
  code,
  language = "bash",
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map common language aliases
  const languageMap: Record<string, string> = {
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    curl: "bash",
    js: "javascript",
    ts: "typescript",
    tsx: "tsx",
    jsx: "jsx",
  };

  const lang = languageMap[language] || language;
  const isBash = lang === "bash";

  return (
    <div className={cn("relative group rounded-lg overflow-hidden", className)}>
      {isBash ? (
        <pre
          className="p-4 text-sm overflow-x-auto font-mono"
          style={{ margin: 0, background: "#011627" }}
        >
          {highlightBash(code.trim())}
        </pre>
      ) : (
        <Highlight theme={themes.nightOwl} code={code.trim()} language={lang}>
          {({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={cn(preClassName, "p-4 text-sm overflow-x-auto")}
              style={{ ...style, margin: 0, background: "#011627" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {showLineNumbers && (
                    <span className="inline-block w-8 text-gray-500 select-none text-right mr-4">
                      {i + 1}
                    </span>
                  )}
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-600"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}
