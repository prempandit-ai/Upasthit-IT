import { NavLink } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { ROLE_NAV_ITEMS } from "../utils/roleRoutes";

const Sidebar = ({ user, open, onClose, onLogout, dashboardPath }) => {
  const navItems = ROLE_NAV_ITEMS[user?.role] || [];

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-label="Sidebar backdrop"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-500">Welcome back</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{user?.name}</p>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <NavLink
              to={dashboardPath}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`
              }
            >
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </NavLink>

            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
