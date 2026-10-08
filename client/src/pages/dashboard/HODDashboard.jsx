import { useCallback, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../context/ToastContext";
import {
  hodApproveFacultyRequest,
  hodCreateCoordinatorRequest,
  hodListPendingFacultyRequest,
  hodRejectFacultyRequest,
} from "../../services/authService";
import LoadingSpinner from "../../components/LoadingSpinner";
import useAuth from "../../hooks/useAuth";

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["Pending Faculty", "Create Coordinator"];

// ── Pending faculty table ─────────────────────────────────────────────────────
const PendingFacultyTable = ({ users, onApprove, onReject, actionLoading }) => {
  if (!users.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-slate-400">No pending faculty requests.</p>
        <p className="mt-1 text-xs text-slate-300">
          New faculty self-registrations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Name
            </th>
            <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
            </th>
            <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Joined
            </th>
            <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-100 last:border-0">
              <td className="py-3 pr-6 font-medium text-slate-800">{u.name}</td>
              <td className="py-3 pr-6 text-slate-500">{u.email}</td>
              <td className="py-3 pr-6 text-slate-400 text-xs">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => onApprove(u.id)}
                    title="Approve Faculty"
                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => onReject(u.id)}
                    title="Reject Faculty"
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const HODDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Pending Faculty");
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchPendingFaculty = useCallback(async () => {
    setLoadingFaculty(true);
    try {
      const { data } = await hodListPendingFacultyRequest();
      setPendingFaculty(data.users);
    } catch {
      showToast("Failed to load pending faculty", "error");
    } finally {
      setLoadingFaculty(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === "Pending Faculty") fetchPendingFaculty();
  }, [activeTab, fetchPendingFaculty]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await hodApproveFacultyRequest(id);
      showToast("Faculty approved", "success");
      fetchPendingFaculty();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await hodRejectFacultyRequest(id);
      showToast("Faculty rejected", "success");
      fetchPendingFaculty();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await hodCreateCoordinatorRequest(form);
      showToast("Coordinator account created successfully", "success");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create Coordinator",
        "error"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-indigo-600">HOD Dashboard</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Welcome, {user?.name}
        </h2>
        <p className="mt-2 text-slate-500">
          Approve faculty registrations and manage your department coordinators.
        </p>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pending Faculty
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {loadingFaculty ? "—" : pendingFaculty.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Pending Faculty" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-bold text-slate-900">
            Faculty Awaiting Approval
          </h3>
          {loadingFaculty ? (
            <LoadingSpinner label="Loading..." />
          ) : (
            <PendingFacultyTable
              users={pendingFaculty}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          )}
        </div>
      )}

      {activeTab === "Create Coordinator" && (
        <div className="max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <PlusCircleIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Create Account
                </p>
                <h3 className="text-base font-bold text-slate-900">
                  New Coordinator
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreateCoordinator} className="space-y-4">
              <div>
                <label
                  htmlFor="coord-name"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Full Name
                </label>
                <input
                  id="coord-name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Coordinator's full name"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label
                  htmlFor="coord-email"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Email
                </label>
                <input
                  id="coord-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="coordinator@university.edu"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label
                  htmlFor="coord-password"
                  className="mb-1 block text-xs font-medium text-slate-600"
                >
                  Temporary Password
                </label>
                <input
                  id="coord-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={formSubmitting}
                className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {formSubmitting ? "Creating..." : "Create Coordinator Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODDashboard;
