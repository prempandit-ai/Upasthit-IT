/**
 * StatusBadge
 * Unified badge for various statuses across the Faculty Portal.
 */
const STATUS_STYLES = {
  // Attendance
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  EXCUSED: 'bg-blue-50 text-blue-700 border-blue-200',

  // Leave / Workflow
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Assignments
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  CLOSED: 'bg-rose-50 text-rose-700 border-rose-200',
  SUBMITTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'NOT SUBMITTED': 'bg-rose-50 text-rose-700 border-rose-200',

  // Events / Campus
  ONGOING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PINNED: 'bg-purple-50 text-purple-700 border-purple-200',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const StatusBadge = ({ status = '', className = '' }) => {
  const norm = String(status).toUpperCase();
  const style = STATUS_STYLES[norm] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors ${style} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
