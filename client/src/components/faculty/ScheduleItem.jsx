import { ClockIcon } from '@heroicons/react/24/outline';

const STATUS_STYLES = {
  Completed: { dot: 'bg-green-500', text: 'text-green-600' },
  Ongoing: { dot: 'bg-amber-500', text: 'text-amber-600' },
  Upcoming: { dot: 'bg-slate-300', text: 'text-slate-500' },
};

/**
 * ScheduleItem
 * A single row in the Today's Schedule list.
 */
const ScheduleItem = ({ startTime, endTime, subject, classGroup, room, status = 'Upcoming' }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Upcoming;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {/* Time column */}
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
        <div className={`h-full w-px bg-slate-100 flex-1 mt-1`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{startTime} – {endTime}</p>
          {/* Status dot */}
          <span className={`flex items-center gap-1 text-xs font-medium ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {status}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">{subject}</p>
        <p className="text-xs text-slate-500">{classGroup}{room ? ` • ${room}` : ''}</p>
      </div>
    </div>
  );
};

export default ScheduleItem;
