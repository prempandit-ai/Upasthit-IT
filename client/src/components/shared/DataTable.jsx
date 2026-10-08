import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { TableSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

/**
 * Reusable DataTable for academic ERP.
 * Clean, compact, accessible, responsive table with pagination.
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  emptyDescription = 'There is no data to show for this view.',
  pagination = null, // { page, limit, total, onPageChange }
  sortConfig = null, // { key, direction, onSort }
  className = '',
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  rowKey = 'id',
}) => {
  const allSelected =
    data.length > 0 && selectedIds.length === data.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <TableSkeleton rows={pagination?.limit || 6} cols={columns.length} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState title={emptyMessage} description={emptyDescription} />
      </div>
    );
  }

  const { page = 1, limit = 10, total = data.length, onPageChange } =
    pagination || {};
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {/* Scrollable container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={onSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key || col.label}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.sortable && sortConfig ? (
                    <button
                      type="button"
                      onClick={() => sortConfig.onSort && sortConfig.onSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-slate-800 transition"
                    >
                      <span>{col.label}</span>
                      <ChevronUpDownIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, idx) => {
              const id = row[rowKey] ?? idx;
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={`transition-colors hover:bg-slate-50/60 ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow && onSelectRow(id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const value = col.key ? row[col.key] : null;
                    return (
                      <td
                        key={col.key || col.label}
                        className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.cellClassName || ''}`}
                      >
                        {col.render ? col.render(value, row, idx) : value ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 px-4 py-3 gap-2">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
            <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> records
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange && onPageChange(page - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              // Sliding window around active page if totalPages > 5
              let pNum = i + 1;
              if (totalPages > 5) {
                if (page > 3 && page < totalPages - 1) {
                  pNum = page - 2 + i;
                } else if (page >= totalPages - 1) {
                  pNum = totalPages - 4 + i;
                }
              }

              const isActive = pNum === page;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => onPageChange && onPageChange(pNum)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange && onPageChange(page + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
