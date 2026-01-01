"use client";

import { useState } from "react";
import { X, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "video" | "comment" | "channel";
  targetId: string;
}

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "violence", label: "Violence or dangerous acts" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "copyright", label: "Copyright violation" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export function ReportDialog({ isOpen, onClose, type, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = { reason };
      if (type === "video") body.video_id = targetId;
      else if (type === "comment") body.comment_id = targetId;
      else if (type === "channel") body.channel_id = targetId;
      if (description.trim()) body.description = description;

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success("Report submitted. Thank you for helping keep our community safe.");
        onClose();
        setReason("");
        setDescription("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit report");
      }
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = type === "video" ? "video" : type === "comment" ? "comment" : "channel";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Report {typeLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Select the reason why you are reporting this {typeLabel}:
          </p>

          <div className="space-y-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reason === r.value
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-900">{r.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
