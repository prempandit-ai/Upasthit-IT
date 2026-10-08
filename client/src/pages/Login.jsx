import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapSolid } from "@heroicons/react/24/solid";
import LoadingSpinner from "../components/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", label: "Admin", email: "admin@upasthit.test", password: "Password123" },
  { role: "HOD", label: "HOD", email: "hod@upasthit.test", password: "Password123" },
  { role: "COORDINATOR", label: "Coordinator", email: "coordinator@upasthit.test", password: "Password123" },
  { role: "FACULTY", label: "Teacher", email: "faculty@upasthit.test", password: "Password123" },
  { role: "STUDENT", label: "Staff", email: "student@upasthit.test", password: "Password123" },
];

const Login = () => {
  const { login, isAuthenticated, loading, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (loading) {
    return <LoadingSpinner label="Restoring session..." />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const executeLogin = async (credentials) => {
    setSubmitting(true);
    try {
      const data = await login(credentials);
      showToast("Login successful", "success");
      navigate(getDashboardPathForRole(data.user.role));
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await executeLogin(form);
  };

  const handleQuickDemoLogin = async (account) => {
    setForm({ email: account.email, password: account.password });
    await executeLogin({ email: account.email, password: account.password });
  };

  return (
    <div className="w-full">
      {/* Top Brand Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20 text-white">
          <AcademicCapSolid className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 uppercase leading-none">
            DMCE IT
          </h2>
          <p className="text-[11px] font-bold tracking-[0.25em] text-cyan-600 uppercase mt-1">
            UPASTHIT
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
          Welcome back <span>👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Sign in to access your dashboard
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="you@dmce.ac.in"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1e3a8a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/10 transition hover:bg-[#172554] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {submitting ? (
            "Signing in..."
          ) : (
            <>
              <span>Sign In</span>
              <ChevronRightIcon className="h-4 w-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Login */}
      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          QUICK DEMO LOGIN
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              disabled={submitting}
              onClick={() => handleQuickDemoLogin(account)}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-xs font-semibold text-slate-700 transition cursor-pointer group text-left disabled:opacity-50"
            >
              <span>{account.label}</span>
              <ChevronRightIcon className="h-3 w-3 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Account Registration Links */}
      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Need an account? </span>
        <Link
          to="/register"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Register as Student
        </Link>
        <span className="mx-1.5">·</span>
        <Link
          to="/register/faculty"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Faculty
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-[11px] text-slate-400">
        © 2026 DMCE · Upasthit ERP v1.0
      </p>
    </div>
  );
};

export default Login;