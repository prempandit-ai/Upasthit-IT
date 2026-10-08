/**
 * FacultyStatCard
 * A compact dashboard stat card with icon, main number, label, and
 * an optional supporting sub-text line.
 */
const FacultyStatCard = ({ label, value, subtitle, icon: Icon, iconBg = 'bg-blue-50', iconColor = 'text-blue-700' }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {Icon && (
        <div className={`shrink-0 rounded-lg p-2.5 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default FacultyStatCard;
