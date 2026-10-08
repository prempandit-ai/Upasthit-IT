import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import RoleBadge from "./RoleBadge";

const Navbar = ({ user, onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              UPASTHIT
            </p>
            <h1 className="text-lg font-bold text-slate-900">Smart Department Platform</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <RoleBadge role={user?.role} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
