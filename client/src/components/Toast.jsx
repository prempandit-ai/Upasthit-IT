const styles = {
  info: "bg-slate-800 text-white border-slate-700",
  success: "bg-emerald-600 text-white border-emerald-500",
  error: "bg-red-600 text-white border-red-500",
  warning: "bg-amber-500 text-white border-amber-400",
};

const Toast = ({ message, type = "info", onClose }) => {
  return (
    <div
      className={`min-w-72 rounded-xl border px-4 py-3 shadow-lg ${styles[type]}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;
