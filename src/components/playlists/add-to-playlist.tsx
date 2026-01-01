"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Check, Loader2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Playlist {
  id: string;
  title: string;
  videoCount: number;
}

interface AddToPlaylistProps {
  videoId: string;
}

export function AddToPlaylist({ videoId }: AddToPlaylistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [videoInPlaylists, setVideoInPlaylists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen, videoId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateNew(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/playlists");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists);

        // Check which playlists contain this video
        const inPlaylists = new Set<string>();
        for (const playlist of data.playlists) {
          const checkResponse = await fetch(`/api/playlists/${playlist.id}`);
          if (checkResponse.ok) {
            const playlistData = await checkResponse.json();
            const hasVideo = playlistData.playlist.videos?.some(
              (v: any) => v.id === videoId
            );
            if (hasVideo) {
              inPlaylists.add(playlist.id);
            }
          }
        }
        setVideoInPlaylists(inPlaylists);
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlaylist = async (playlistId: string) => {
    const isInPlaylist = videoInPlaylists.has(playlistId);

    try {
      if (isInPlaylist) {
        // Remove from playlist
        const response = await fetch(`/api/playlists/${playlistId}/videos`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        if (response.ok) {
          setVideoInPlaylists((prev) => {
            const next = new Set(prev);
            next.delete(playlistId);
            return next;
          });
          toast.success("Removed from playlist");
        }
      } else {
        // Add to playlist
        const response = await fetch(`/api/playlists/${playlistId}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        if (response.ok) {
          setVideoInPlaylists((prev) => new Set([...prev, playlistId]));
          toast.success("Added to playlist");
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to add to playlist");
        }
      }
    } catch {
      toast.error("Failed to update playlist");
    }
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      // Create playlist
      const createResponse = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, visibility: "public" }),
      });

      if (createResponse.ok) {
        const data = await createResponse.json();
        const newPlaylist = data.playlist;

        // Add video to new playlist
        const addResponse = await fetch(`/api/playlists/${newPlaylist.id}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });

        if (addResponse.ok) {
          setPlaylists((prev) => [
            { ...newPlaylist, videoCount: 1 },
            ...prev,
          ]);
          setVideoInPlaylists((prev) => new Set([...prev, newPlaylist.id]));
          setNewTitle("");
          setShowCreateNew(false);
          toast.success(`Added to "${newPlaylist.title}"`);
        }
      }
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <ListPlus className="h-4 w-4" />
        Save
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b">
            <h3 className="font-medium text-gray-900">Save to playlist</h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : playlists.length === 0 && !showCreateNew ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No playlists yet
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => togglePlaylist(playlist.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      videoInPlaylists.has(playlist.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {videoInPlaylists.has(playlist.id) && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {playlist.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t">
            {showCreateNew ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Playlist name"
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createAndAdd();
                    if (e.key === "Escape") setShowCreateNew(false);
                  }}
                />
                <Button
                  size="sm"
                  onClick={createAndAdd}
                  disabled={isCreating || !newTitle.trim()}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create new playlist
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
