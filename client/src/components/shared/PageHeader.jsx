import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Reusable PageHeader with breadcrumbs and action buttons.
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = null,
  className = '',
}) => {
  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRightIcon className="h-3 w-3 text-slate-400" />}
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      className="transition-colors hover:text-blue-600 text-slate-500"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'font-medium text-slate-800' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
