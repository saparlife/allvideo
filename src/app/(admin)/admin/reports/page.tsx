import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, CheckCircle, XCircle, Clock, Video, MessageSquare, User } from "lucide-react";
import { ReportActions } from "./report-actions";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate Speech",
  violence: "Violence",
  sexual: "Sexual Content",
  copyright: "Copyright Violation",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  action_taken: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
};

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const db = supabase as any;

  // Get all reports with reporter info
  const { data: reports } = await db
    .from("content_reports")
    .select(`
      *,
      reporter:reporter_id (id, username, email),
      reviewer:reviewed_by (id, username)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Get stats
  const { count: pendingCount } = await db
    .from("content_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: totalCount } = await db
    .from("content_reports")
    .select("*", { count: "exact", head: true });

  const reportList = reports || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Reports</h1>
        <p className="text-gray-600">Review and moderate flagged content</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Reports</CardTitle>
            <Flag className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reportList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reports yet
            </div>
          ) : (
            <div className="space-y-4">
              {reportList.map((report: any) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Content type and ID */}
                      <div className="flex items-center gap-2 mb-2">
                        {report.content_type === "video" && <Video className="h-4 w-4 text-blue-500" />}
                        {report.content_type === "comment" && <MessageSquare className="h-4 w-4 text-green-500" />}
                        {report.content_type === "user" && <User className="h-4 w-4 text-purple-500" />}
                        <span className="font-medium capitalize">{report.content_type}</span>
                        <span className="text-xs text-gray-400 font-mono">{report.content_id}</span>
                      </div>

                      {/* Reason and description */}
                      <div className="mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      )}

                      {/* Reporter and date */}
                      <div className="text-xs text-gray-400">
                        Reported by {report.reporter?.username || report.reporter?.email || "Unknown"} on{" "}
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>

                      {/* Action taken */}
                      {report.action_taken && (
                        <div className="mt-2 text-xs text-green-600">
                          Action: {report.action_taken}
                        </div>
                      )}
                    </div>

                    {/* Status and actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                        {report.status}
                      </span>

                      {report.status === "pending" && (
                        <ReportActions reportId={report.id} contentType={report.content_type} contentId={report.content_id} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
