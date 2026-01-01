"use client";

import { AnalyticsChart, BarChart } from "@/components/studio/analytics-chart";

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartsProps {
  viewsData: DataPoint[];
  subsData: DataPoint[];
  performanceData: DataPoint[];
  rangeLabel: string;
}

function getRangeLabel(range: string): string {
  switch (range) {
    case "28d": return "Last 28 days";
    case "90d": return "Last 90 days";
    case "365d": return "Last 365 days";
    default: return "Last 7 days";
  }
}

export function AnalyticsCharts({
  viewsData,
  subsData,
  performanceData,
  rangeLabel,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsChart
        title={`Views (${rangeLabel})`}
        data={viewsData}
        color="#6366f1"
        height={220}
      />
      <AnalyticsChart
        title={`New Subscribers (${rangeLabel})`}
        data={subsData}
        color="#10b981"
        height={220}
      />
      <div className="lg:col-span-2">
        <BarChart
          title="Top Videos by Views"
          data={performanceData}
          color="#6366f1"
          height={180}
        />
      </div>
    </div>
  );
}
