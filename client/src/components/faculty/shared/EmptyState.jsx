import { InboxIcon } from '@heroicons/react/24/outline';

/**
 * EmptyState
 * Clean placeholder when no data exists.
 */
const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'No records found',
  description = 'There are no items to display right now.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
