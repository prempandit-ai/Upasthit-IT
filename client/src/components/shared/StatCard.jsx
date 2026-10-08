import React from 'react';

/**
 * Reusable StatCard across all portals (HOD, Faculty, Admin).
 * Meets professional academic ERP styling:
 * Clean white card, subtle border (#E2E8F0), small shadow, rounded corners.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className = '',
  onClick,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs transition-all hover:shadow-sm ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {value ?? '—'}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${badgeStyles[badgeType] || badgeStyles.neutral}`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
