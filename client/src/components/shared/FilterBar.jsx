import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Reusable FilterBar matching academic ERP screenshots:
 * Search input + Dropdowns + Apply Filters & Reset buttons.
 */
const FilterBar = ({
  search = null, // { value, onChange, placeholder }
  filters = [], // Array<{ id, label, value, onChange, options: Array<{ value, label }> }>
  onApply = null,
  onReset = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs ${className}`}>
      {/* Search Input */}
      {search && (
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || 'Search...'}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Select Filters */}
      {filters.map((f) => (
        <div key={f.id} className="min-w-[140px] flex-1 sm:flex-initial">
          {f.label && (
            <label htmlFor={f.id} className="sr-only">
              {f.label}
            </label>
          )}
          <select
            id={f.id}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {onApply && (
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <FunnelIcon className="h-3.5 w-3.5" />
            Apply Filters
          </button>
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowPathIcon className="h-3.5 w-3.5 text-slate-400" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
