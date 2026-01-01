"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Video, User, Loader2, X, Clock, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface Suggestion {
  type: "video" | "channel" | "history";
  id: string;
  title: string;
  slug?: string;
  username?: string;
  thumbnail?: string | null;
  avatar?: string | null;
}

interface SearchHistoryItem {
  query: string;
  searched_at: string;
}

export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch search history on mount
  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch("/api/search/history");
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history || []);
      }
    } catch {
      // Silently fail
    }
  };

  const saveSearchHistory = async (searchQuery: string) => {
    try {
      await fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      fetchSearchHistory(); // Refresh history
    } catch {
      // Silently fail
    }
  };

  const deleteHistoryItem = async (historyQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/search/history?query=${encodeURIComponent(historyQuery)}`, {
        method: "DELETE",
      });
      setSearchHistory((prev) => prev.filter((h) => h.query !== historyQuery));
    } catch {
      // Silently fail
    }
  };

  // Debounced search
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query.length >= 2) {
      setIsLoading(true);
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      saveSearchHistory(query.trim());
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setIsOpen(false);
    saveSearchHistory(historyQuery);
    router.push(`/search?q=${encodeURIComponent(historyQuery)}`);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setIsOpen(false);
    setQuery("");
    if (suggestion.type === "video") {
      router.push(`/watch/${suggestion.slug}`);
    } else {
      router.push(`/channel/${suggestion.username}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative flex-1 max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="w-full h-10 pl-4 pr-12 rounded-full border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1 top-1 h-8 w-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <Search className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {isOpen && (query.length >= 2 || suggestions.length > 0 || (query.length === 0 && searchHistory.length > 0)) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
        >
          {/* Show search history when input is empty */}
          {query.length === 0 && searchHistory.length > 0 ? (
            <ul className="py-1">
              <li className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent searches
              </li>
              {searchHistory.map((item) => (
                <li key={item.query}>
                  <button
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="flex-1 text-sm text-gray-700 truncate">
                      {item.query}
                    </span>
                    <button
                      onClick={(e) => deleteHistoryItem(item.query, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-gray-400" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          ) : suggestions.length === 0 && !isLoading && query.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.type}-${suggestion.id}`}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {suggestion.type === "video" ? (
                      <>
                        <div className="w-10 h-7 bg-gray-200 rounded overflow-hidden shrink-0">
                          {suggestion.thumbnail && (
                            <img
                              src={suggestion.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {suggestion.title}
                          </p>
                          <p className="text-xs text-gray-500">Video</p>
                        </div>
                        <Video className="w-4 h-4 text-gray-400 shrink-0" />
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-white text-xs font-medium">
                          {suggestion.avatar ? (
                            <img
                              src={suggestion.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            suggestion.title[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {suggestion.title}
                          </p>
                          <p className="text-xs text-gray-500">Channel</p>
                        </div>
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                      </>
                    )}
                  </button>
                </li>
              ))}
              {query.trim() && (
                <li className="border-t">
                  <button
                    onClick={() => handleSubmit()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      Search for &quot;{query}&quot;
                    </span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
