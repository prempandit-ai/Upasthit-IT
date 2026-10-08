const StatCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
