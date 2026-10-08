import { useCallback, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  PlusCircleIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../context/ToastContext";
import {
  adminApproveUserRequest,
  adminCreateFacultyRequest,
  adminCreateHodRequest,
  adminDeactivateUserRequest,
  adminListUsersRequest,
  adminRejectUserRequest,
  verifyRoleRoute,
} from "../../services/authService";
import LoadingSpinner from "../../components/LoadingSpinner";
import RoleBadge from "../../components/RoleBadge";

// ── Status pill ───────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
};

// ── Create user form ──────────────────────────────────────────────────────────
const CreateUserForm = ({ title, roleLabel, onSubmit, submitting }) => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSubmit(form);
    if (ok) setForm({ name: "", email: "", password: "" });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <PlusCircleIcon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Create Account
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor={`${roleLabel}-name`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Full Name
          </label>
          <input
            id={`${roleLabel}-name`}
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Dr. Jane Smith"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor={`${roleLabel}-email`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Email
          </label>
          <input
            id={`${roleLabel}-email`}
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="user@university.edu"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor={`${roleLabel}-password`}
            className="mb-1 block text-xs font-medium text-slate-600"
          >
            Temporary Password
          </label>
          <input
            id={`${roleLabel}-password`}
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
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "Creating..." : `Create ${roleLabel} Account`}
        </button>
      </form>
    </div>
  );
};

// ── Users table ───────────────────────────────────────────────────────────────
const UsersTable = ({ users, onApprove, onReject, onDeactivate, actionLoading }) => {
  if (!users.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">No users found.</p>
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
              Role
            </th>
            <th className="pb-3 pr-6 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
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
              <td className="py-3 pr-6">
                <RoleBadge role={u.role} />
              </td>
              <td className="py-3 pr-6">
                <StatusPill status={u.status} />
                {!u.isActive && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    Deactivated
                  </span>
                )}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {u.status === "PENDING" && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading === u.id}
                        onClick={() => onApprove(u.id)}
                        title="Approve"
                        className="rounded-lg p-1.5 text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === u.id}
                        onClick={() => onReject(u.id)}
                        title="Reject"
                        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  {u.isActive && u.status === "APPROVED" && (
                    <button
                      type="button"
                      disabled={actionLoading === u.id}
                      onClick={() => onDeactivate(u.id)}
                      title="Deactivate"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 disabled:opacity-50"
                    >
                      <ShieldExclamationIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Tab navigation ────────────────────────────────────────────────────────────
const TABS = ["User Management", "Create HOD", "Create Faculty"];

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("User Management");
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [rbacVerified, setRbacVerified] = useState(false);

  // Verify admin RBAC on mount
  useEffect(() => {
    verifyRoleRoute("ADMIN")
      .then(() => setRbacVerified(true))
      .catch(() => setRbacVerified(false));
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      const { data } = await adminListUsersRequest(params);
      setUsers(data.users);
    } catch {
      showToast("Failed to load users", "error");
    } finally {
      setUsersLoading(false);
    }
  }, [filterRole, filterStatus, showToast]);

  useEffect(() => {
    if (activeTab === "User Management") fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminApproveUserRequest(id);
      showToast("User approved", "success");
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await adminRejectUserRequest(id);
      showToast("User rejected", "success");
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id) => {
    setActionLoading(id);
    try {
      await adminDeactivateUserRequest(id);
      showToast("User deactivated", "success");
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to deactivate", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateHod = async (payload) => {
    setFormSubmitting(true);
    try {
      await adminCreateHodRequest(payload);
      showToast("HOD account created successfully", "success");
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create HOD", "error");
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateFaculty = async (payload) => {
    setFormSubmitting(true);
    try {
      await adminCreateFacultyRequest(payload);
      showToast("Faculty account created successfully", "success");
      return true;
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to create Faculty",
        "error"
      );
      return false;
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-indigo-600">Administrator Dashboard</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">User Management</h2>
        <p className="mt-2 text-slate-500">
          Create, approve, and manage all users across the system.
          {rbacVerified && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              RBAC Verified
            </span>
          )}
        </p>
      </section>

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
      {activeTab === "User Management" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">All Users</span>
            </div>
            <div className="ml-auto flex gap-3">
              <select
                id="filter-role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="HOD">HOD</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <LoadingSpinner label="Loading users..." />
          ) : (
            <UsersTable
              users={users}
              onApprove={handleApprove}
              onReject={handleReject}
              onDeactivate={handleDeactivate}
              actionLoading={actionLoading}
            />
          )}
        </div>
      )}

      {activeTab === "Create HOD" && (
        <div className="max-w-md">
          <CreateUserForm
            title="New Head of Department"
            roleLabel="HOD"
            onSubmit={handleCreateHod}
            submitting={formSubmitting}
          />
        </div>
      )}

      {activeTab === "Create Faculty" && (
        <div className="max-w-md">
          <CreateUserForm
            title="New Faculty Member"
            roleLabel="Faculty"
            onSubmit={handleCreateFaculty}
            submitting={formSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
