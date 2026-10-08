import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          404
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-3 text-slate-500">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
