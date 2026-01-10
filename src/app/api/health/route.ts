import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    database: {
      status: "up" | "down";
      latency?: number;
    };
    storage: {
      status: "up" | "down";
    };
  };
  uptime: number;
}

const startTime = Date.now();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const health: HealthStatus = {
    status: "healthy",
    timestamp,
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: { status: "down" },
      storage: { status: "up" }, // R2 is managed, assume up
    },
    uptime,
  };

  // Check database connection
  try {
    const supabase = createAdminClient();
    const start = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("users")
      .select("id")
      .limit(1);

    const latency = Date.now() - start;

    if (error) {
      health.services.database = { status: "down" };
      health.status = "unhealthy";
    } else {
      health.services.database = { status: "up", latency };
    }
  } catch {
    health.services.database = { status: "down" };
    health.status = "unhealthy";
  }

  // Return appropriate status code
  const statusCode = health.status === "healthy" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
