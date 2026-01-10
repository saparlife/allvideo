import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface WorkerHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  worker: {
    lastSeen: string | null;
    isActive: boolean;
    pendingJobs: number;
    processingJobs: number;
  };
}

/**
 * GET /api/health/worker
 * Check worker health status
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  const health: WorkerHealthStatus = {
    status: "healthy",
    timestamp,
    worker: {
      lastSeen: null,
      isActive: false,
      pendingJobs: 0,
      processingJobs: 0,
    },
  };

  try {
    const supabase = createAdminClient();

    // Get pending jobs count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: pendingCount } = await (supabase as any)
      .from("transcode_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get processing jobs (to check if worker is active)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: processingJobs, count: processingCount } = await (supabase as any)
      .from("transcode_jobs")
      .select("updated_at, worker_id", { count: "exact" })
      .eq("status", "processing")
      .order("updated_at", { ascending: false })
      .limit(1);

    health.worker.pendingJobs = pendingCount || 0;
    health.worker.processingJobs = processingCount || 0;

    // Check if worker is active (has updated a job in last 5 minutes)
    if (processingJobs && processingJobs.length > 0) {
      const lastUpdate = new Date(processingJobs[0].updated_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      health.worker.lastSeen = processingJobs[0].updated_at;
      health.worker.isActive = lastUpdate > fiveMinutesAgo;
    }

    // Determine overall status
    if (health.worker.pendingJobs > 10 && !health.worker.isActive) {
      health.status = "unhealthy"; // Many pending jobs but worker not active
    } else if (health.worker.pendingJobs > 5) {
      health.status = "degraded"; // Queue building up
    }
  } catch {
    health.status = "unhealthy";
  }

  const statusCode = health.status === "healthy" ? 200 :
                     health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
