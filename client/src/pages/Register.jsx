import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapSolid } from "@heroicons/react/24/solid";
import LoadingSpinner from "../components/LoadingSpinner";
import { registerStudentRequest } from "../services/authService";
import { useToast } from "../context/ToastContext";
import useAuth from "../hooks/useAuth";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const Register = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await registerStudentRequest(form);
      setSubmitted(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Registration failed. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <CheckCircleIcon className="h-9 w-9" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Registration Submitted!
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
          Your student account is <span className="font-semibold text-amber-600">pending approval</span>. A Coordinator will review your request — you will be able to log in once approved.
        </p>
        <Link
          to="/login"
          className="mt-6 rounded-xl bg-[#1e3a8a] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#172554]"
        >
          Back to Login
        </Link>
      </div>
    );
  }

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

      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
          Create Student Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your account will be verified by a coordinator before activation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reg-name"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="student@dmce.ac.in"
          />
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            placeholder="Min 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-[#1e3a8a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/10 transition hover:bg-[#172554] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Are you faculty? </span>
        <Link
          to="/register/faculty"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Register as Faculty
        </Link>
      </div>

      <div className="mt-2 text-center text-xs text-slate-400">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          Sign In
        </Link>
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        © 2026 DMCE · Upasthit ERP v1.0
      </p>
    </div>
  );
};

export default Register;