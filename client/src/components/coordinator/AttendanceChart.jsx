import React from 'react';
import DonutChart from '../shared/DonutChart';

/**
 * AttendanceChart component for Coordinator Portal:
 * Donut chart displaying Present %, Absent %, and Not Marked %, with legend and action button.
 */
const AttendanceChart = ({
  present = 68,
  absent = 22,
  notMarked = 10,
  overallRate = '68%',
  onViewReport,
  className = '',
}) => {
  const chartData = [
    { label: 'Present', value: present, color: '#0F172A' },   // Slate-900 / Navy
    { label: 'Absent', value: absent, color: '#94A3B8' },     // Slate-400
    { label: 'Not Marked', value: notMarked, color: '#E2E8F0' }, // Slate-200
  ];

  return (
    <div className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Attendance Overview
        </h4>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
          {/* Circular Donut Visualization */}
          <DonutChart
            data={chartData}
            centerValue={overallRate}
            centerLabel="Overall"
            size={130}
            strokeWidth={14}
          />

          {/* Legend */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" />
                Present
              </span>
              <span className="font-bold text-slate-900">{present}%</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
                Absent
              </span>
              <span className="font-bold text-slate-900">{absent}%</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
                Not Marked
              </span>
              <span className="font-bold text-slate-900">{notMarked}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onViewReport}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          View Detailed Report
        </button>
      </div>
    </div>
  );
};

export default AttendanceChart;
