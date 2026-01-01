"use client";

import { Radio } from "lucide-react";

interface StreamStatusBadgeProps {
  status: string;
}

export function StreamStatusBadge({ status }: StreamStatusBadgeProps) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    offline: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-400",
      label: "Offline",
    },
    starting: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
      label: "Starting",
    },
    live: {
      bg: "bg-red-100",
      text: "text-red-700",
      dot: "bg-red-500 animate-pulse",
      label: "LIVE",
    },
    ended: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Ended",
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
