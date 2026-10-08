import React from 'react';

/**
 * Lightweight zero-dependency SVG Donut Chart.
 * Matches screenshots for Attendance, OP Summary, Faculty Breakdown, Audit Activity.
 */
const DonutChart = ({
  data = [], // [{ label: 'Present', value: 87, color: '#0F172A' }, ...]
  centerValue = '87%',
  centerLabel = 'Overall',
  size = 140,
  strokeWidth = 14,
  className = '',
}) => {
  const total = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {total > 0 &&
          data.map((item, index) => {
            const val = Number(item.value) || 0;
            const percent = val / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += percent;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color || '#2563EB'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500"
              />
            );
          })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
          {centerValue}
        </span>
        {centerLabel && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
