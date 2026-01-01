"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TimeRangeSelectorProps {
  currentRange: string;
}

const ranges = [
  { value: "7d", label: "Last 7 days" },
  { value: "28d", label: "Last 28 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last 365 days" },
];

export function TimeRangeSelector({ currentRange }: TimeRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range === "7d") {
      params.delete("range");
    } else {
      params.set("range", range);
    }
    router.push(`/studio/analytics?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => handleChange(range.value)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            currentRange === range.value
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
