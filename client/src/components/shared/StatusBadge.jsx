import React from 'react';

/**
 * Reusable StatusBadge for HOD and academic ERP portals.
 * Standardizes statuses: OP requests, faculty attendance, audit, approvals.
 */
const STATUS_STYLES = {
  // OP & Approvals
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  'AWAITING APPROVAL': 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  'ON HOLD': 'bg-slate-100 text-slate-700 border-slate-300',
  'UNDER REVIEW': 'bg-blue-50 text-blue-700 border-blue-200',

  // Attendance
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  'ON LEAVE': 'bg-purple-50 text-purple-700 border-purple-200',
  'OFFICIAL DUTY': 'bg-blue-50 text-blue-700 border-blue-200',

  // Faculty / User status
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
  DEACTIVATED: 'bg-slate-100 text-slate-600 border-slate-200',

  // Audit
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Employment
  'FULL TIME': 'bg-blue-50 text-blue-700 border-blue-200',
  'PART TIME': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const StatusBadge = ({ status = '', className = '', size = 'sm' }) => {
  const norm = String(status || '').toUpperCase().trim();
  const style = STATUS_STYLES[norm] || 'bg-slate-50 text-slate-700 border-slate-200';

  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium transition-colors ${sizeClasses[size] || sizeClasses.sm} ${style} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {status}
    </span>
  );
};

export default StatusBadge;
