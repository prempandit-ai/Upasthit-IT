import { useNavigate } from 'react-router-dom';

/**
 * QuickActionCard
 * A clickable action tile with icon + label.
 */
const QuickActionCard = ({ label, icon: Icon, href = '#', iconBg = 'bg-blue-50', iconColor = 'text-blue-700' }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className={`rounded-xl p-3 transition group-hover:scale-105 ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
        {label}
      </span>
    </button>
  );
};

export default QuickActionCard;
