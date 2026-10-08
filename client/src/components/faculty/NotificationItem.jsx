import { BellIcon } from '@heroicons/react/24/outline';

/**
 * NotificationItem
 * A single notification row.
 */
const NotificationItem = ({ title, subtitle, time, unread = false }) => {
  return (
    <div className={`flex items-start gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50 ${unread ? 'bg-blue-50/40' : ''}`}>
      <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${unread ? 'bg-blue-100' : 'bg-slate-100'}`}>
        <BellIcon className={`h-3.5 w-3.5 ${unread ? 'text-blue-700' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${unread ? 'text-slate-900' : 'text-slate-700'}`}>{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>}
        {time && <p className="mt-1 text-xs text-slate-400">{time}</p>}
      </div>
      {unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
    </div>
  );
};

export default NotificationItem;
