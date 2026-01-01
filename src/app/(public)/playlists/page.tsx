"use client";

import { useState, useEffect } from "react";
import { Plus, Play, Lock, Globe, Loader2, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";

interface Playlist {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  videoCount: number;
  thumbnails: string[];
  created_at: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVisibility, setNewVisibility] = useState("public");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/playlists");
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a playlist title");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          visibility: newVisibility,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists((prev) => [{ ...data.playlist, videoCount: 0, thumbnails: [] }, ...prev]);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
        setNewVisibility("public");
        toast.success("Playlist created");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create playlist");
      }
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        toast.success("Playlist deleted");
      } else {
        toast.error("Failed to delete playlist");
      }
    } catch {
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Playlists</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">You don&apos;t have any playlists yet</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first playlist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/playlist/${playlist.id}`}>
                <div className="relative aspect-video bg-gray-100">
                  {playlist.thumbnails.length > 0 ? (
                    <div className="grid grid-cols-2 grid-rows-2 h-full">
                      {playlist.thumbnails.slice(0, 4).map((thumb, i) => (
                        <div key={i} className="relative">
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {playlist.thumbnails.length < 4 &&
                        Array.from({ length: 4 - playlist.thumbnails.length }).map(
                          (_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-200" />
                          )
                        )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
                    {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    {playlist.visibility === "private" ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    <span className="capitalize">{playlist.visibility}</span>
                  </div>
                </div>
              </Link>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/studio/playlists/${playlist.id}`}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deletePlaylist(playlist.id);
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Playlist
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="My awesome playlist"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={createPlaylist} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
