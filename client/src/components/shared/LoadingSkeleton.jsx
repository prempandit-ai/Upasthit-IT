import React from 'react';

/**
 * Loading skeletons for stat cards, tables, and cards.
 */
export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-slate-100 rounded-t-lg mb-2" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex gap-4 p-3 bg-slate-50/70 rounded border border-slate-100">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-200 rounded"
                style={{ width: `${Math.max(40, 100 - cIdx * 12)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="h-24 rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
          <div className="h-6 w-16 bg-slate-300 rounded mb-2" />
          <div className="h-2 w-32 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
};

export default {
  TableSkeleton,
  CardSkeleton,
};
