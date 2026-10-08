import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * PageHeader
 * Reusable header with breadcrumbs and action buttons.
 *
 * Props:
 *  - title: string
 *  - breadcrumbs: Array<{ label: string, href?: string }>
 *  - actions: ReactNode (buttons on right)
 */
const PageHeader = ({ title, breadcrumbs = [], actions = null }) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRightIcon className="h-3 w-3 text-slate-400" />}
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="hover:text-blue-600 transition-colors">
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
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
