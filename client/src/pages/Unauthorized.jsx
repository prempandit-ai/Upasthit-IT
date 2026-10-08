import { Link } from "react-router-dom";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import useAuth from "../hooks/useAuth";

const Unauthorized = () => {
  const { user, dashboardPath } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldExclamationIcon className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Unauthorized</h1>
        <p className="mt-3 text-slate-500">
          You do not have permission to access this page
          {user?.role ? ` with the ${user.role} role` : ""}.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              to={dashboardPath}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to My Dashboard
            </Link>
          ) : null}
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
