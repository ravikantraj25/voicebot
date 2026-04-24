/**
 * Analytics Chart Component
 * Interactive SVG donut chart showing call distribution
 * This is a CUSTOM chart - no charting library needed!
 */
import React, { useMemo } from 'react';

const CHART_COLORS = [
  { label: 'Confirmed', color: '#10b981', key: 'confirmed' },
  { label: 'Rejected', color: '#ef4444', key: 'rejected' },
  { label: 'Pending', color: '#f59e0b', key: 'pending' },
  { label: 'Failed', color: '#f97316', key: 'failed' },
  { label: 'No Response', color: '#64748b', key: 'noResponse' },
];

const DonutChart = ({ data, size = 180 }) => {
  const total = useMemo(() => {
    return CHART_COLORS.reduce((sum, item) => sum + (data?.[item.key] || 0), 0);
  }, [data]);

  const segments = useMemo(() => {
    if (total === 0) return [];

    const radius = (size - 20) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    let currentAngle = -90; // Start from top

    return CHART_COLORS.map((item) => {
      const value = data?.[item.key] || 0;
      if (value === 0) return null;

      const percentage = value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate arc path
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');

      currentAngle = endAngle;

      return {
        ...item,
        value,
        percentage: (percentage * 100).toFixed(1),
        pathData,
      };
    }).filter(Boolean);
  }, [data, total, size]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={(size - 20) / 2}
              fill="none"
              stroke="rgba(100,116,139,0.2)"
              strokeWidth="2"
            />
          ) : (
            segments.map((seg, i) => (
              <path
                key={i}
                d={seg.pathData}
                fill={seg.color}
                opacity={0.85}
                className="transition-opacity duration-300 hover:opacity-100 cursor-pointer"
              >
                <title>{seg.label}: {seg.value} ({seg.percentage}%)</title>
              </path>
            ))
          )}
          {/* Center circle (donut hole) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 20) / 2 - 35}
            fill="rgb(15, 23, 42)"
            className="drop-shadow-lg"
          />
          {/* Center text */}
          <text
            x={size / 2}
            y={size / 2 - 8}
            textAnchor="middle"
            className="fill-surface-100 text-2xl font-bold"
            fontSize="28"
          >
            {total}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 14}
            textAnchor="middle"
            className="fill-surface-400"
            fontSize="11"
          >
            Total Calls
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {CHART_COLORS.map((item) => {
          const value = data?.[item.key] || 0;
          if (value === 0 && total > 0) return null;
          return (
            <div key={item.key} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-surface-400">
                {item.label}: {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnalyticsChart = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="glass-card p-6 h-72 shimmer animate-in opacity-0 delay-200" />
    );
  }

  const successRate = analytics?.successRate || 0;

  return (
    <div className="glass-card p-6 animate-in opacity-0 delay-200">
      <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
        Call Distribution
      </h3>
      <DonutChart data={analytics} />

      {/* Success Rate Bar */}
      <div className="mt-5 pt-4 border-t border-surface-700/50">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-surface-400">Success Rate</span>
          <span className="font-bold text-emerald-400">{successRate}%</span>
        </div>
        <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
