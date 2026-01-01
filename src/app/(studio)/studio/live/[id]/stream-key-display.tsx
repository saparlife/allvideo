"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";

interface StreamKeyDisplayProps {
  streamKey: string;
}

export function StreamKeyDisplay({ streamKey }: StreamKeyDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamKey);
      setCopied(true);
      toast.success("Stream key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const maskedKey = streamKey.slice(0, 8) + "•".repeat(16) + streamKey.slice(-4);

  return (
    <div>
      <label className="text-sm text-gray-500 block mb-1">Stream Key</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
          {isVisible ? streamKey : maskedKey}
        </code>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
          title={isVisible ? "Hide key" : "Show key"}
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4 text-gray-400" />
          ) : (
            <Eye className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Keep your stream key private. Anyone with this key can stream to your channel.
      </p>
    </div>
  );
}
