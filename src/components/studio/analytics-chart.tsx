"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export function AnalyticsChart({
  data,
  title,
  color = "#6366f1",
  height = 200,
}: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-400"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  const range = maxValue - minValue;

  // Calculate chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100; // Use percentages
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for line chart
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * (100 - padding.left - padding.right);
    const y = padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x}% ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0}% ${padding.top + chartHeight} L ${padding.left}% ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height }} className="relative">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Y-axis labels */}
          {yLabels.map((label, i) => {
            const y = padding.top + chartHeight - (i / (yLabels.length - 1)) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={`${padding.left}%`}
                  y1={y}
                  x2="95%"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={`${padding.left - 5}%`}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[10px] fill-gray-500"
                >
                  {formatValue(label)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={`${point.x}%`}
              cy={point.y}
              r="3"
              fill="white"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="hover:r-4 transition-all"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-12">
          {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d, i) => (
            <span key={i} className="text-xs text-gray-500">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

interface BarChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
}

export function BarChart({
  data,
  title,
  color = "#6366f1",
  height = 200,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-400"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height }} className="flex items-end gap-2">
        {data.map((d, i) => {
          const heightPercent = (d.value / maxValue) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-600">{formatValue(d.value)}</span>
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  minHeight: d.value > 0 ? "4px" : "0",
                }}
              />
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
