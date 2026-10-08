import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

/**
 * AttendanceOverview
 * Shows summary stats and per-class attendance status.
 *
 * Props (all from API data; component handles null gracefully):
 *   summary: { conducted, submitted, pending, averagePct }
 *   classes: Array<{ subject, classGroup, status: 'SUBMITTED'|'PENDING', present, total }>
 */
const AttendanceOverview = ({ summary = null, classes = [] }) => {
  const conducted = summary?.conducted ?? 0;
  const submitted = summary?.submitted ?? 0;
  const pending = summary?.pending ?? 0;
  const averagePct = summary?.averagePct ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Attendance Overview — Today</h2>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xl font-bold text-slate-900">{conducted}</p>
          <p className="mt-0.5 text-xs text-slate-500">Conducted</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-xl font-bold text-green-700">{submitted}</p>
          <p className="mt-0.5 text-xs text-green-600">Submitted</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-xl font-bold text-amber-700">{pending}</p>
          <p className="mt-0.5 text-xs text-amber-600">Pending</p>
        </div>
      </div>

      {/* Average */}
      {averagePct !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Average Student Attendance</span>
            <span className="font-semibold text-slate-900">{averagePct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(averagePct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-class list */}
      {classes.length > 0 ? (
        <div className="space-y-2">
          {classes.map((cls, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{cls.subject} – {cls.classGroup}</p>
                {cls.status === 'SUBMITTED' && cls.present != null && (
                  <p className="text-xs text-slate-500">{cls.present} / {cls.total} Present</p>
                )}
              </div>
              <div className="ml-2 shrink-0">
                {cls.status === 'SUBMITTED' ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Submitted
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-slate-400 py-3">
          {conducted === 0 ? 'No classes conducted yet today.' : 'All attendance has been submitted.'}
        </p>
      )}
    </div>
  );
};

export default AttendanceOverview;
