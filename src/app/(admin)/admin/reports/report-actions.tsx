"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Ban, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReportActionsProps {
  reportId: string;
  contentType: "video" | "comment" | "user";
  contentId: string;
}

export function ReportActions({ reportId, contentType, contentId }: ReportActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: string) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: reportId,
          content_type: contentType,
          content_id: contentId,
          action,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Action completed");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to perform action");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("dismiss")}
        title="Dismiss report"
        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
      >
        <XCircle className="h-4 w-4" />
      </Button>

      {contentType === "video" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("remove_video")}
          title="Remove video"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      {contentType === "comment" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("hide_comment")}
          title="Hide comment"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      {contentType === "user" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction("ban_user")}
          title="Ban user"
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("reviewed")}
        title="Mark as reviewed"
        className="h-8 w-8 p-0 text-green-400 hover:text-green-600"
      >
        <CheckCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
