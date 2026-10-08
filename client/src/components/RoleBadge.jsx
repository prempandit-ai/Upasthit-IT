import { ROLE_LABELS } from "../utils/roleRoutes";

const roleStyles = {
  ADMIN: "bg-rose-100 text-rose-700 ring-rose-200",
  STUDENT: "bg-sky-100 text-sky-700 ring-sky-200",
  FACULTY: "bg-violet-100 text-violet-700 ring-violet-200",
  HOD: "bg-amber-100 text-amber-700 ring-amber-200",
  COORDINATOR: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const RoleBadge = ({ role }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyles[role] || "bg-slate-100 text-slate-700 ring-slate-200"}`}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
};

export default RoleBadge;
