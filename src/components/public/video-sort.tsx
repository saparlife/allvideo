"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface VideoSortProps {
  value?: string;
  options?: { value: string; label: string }[];
}

const defaultOptions = [
  { value: "recent", label: "Most recent" },
  { value: "popular", label: "Most popular" },
  { value: "oldest", label: "Oldest first" },
];

export function VideoSort({ value, options = defaultOptions }: VideoSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = value || searchParams.get("sort") || options[0].value;

  const handleChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
