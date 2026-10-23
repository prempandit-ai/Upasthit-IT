import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const DASHBOARDS = [
  { label: "HOD Dashboard", role: "HOD", href: "/dashboard/hod" },
  { label: "Faculty Dashboard", role: "FACULTY", href: "/dashboard/faculty" },
];

const DashboardRoleTabs = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const roles = user?.roles || (user?.role ? [user.role] : []);
  const availableDashboards = DASHBOARDS.filter(({ role }) => roles.includes(role));

  if (availableDashboards.length < 2) return null;

  return (
    <nav
      aria-label="Role dashboards"
      role="tablist"
      className="mb-6 flex gap-2 border-b border-slate-200"
    >
      {availableDashboards.map(({ label, role, href }) => {
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={role}
            to={href}
            role="tab"
            aria-selected={isActive}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DashboardRoleTabs;
