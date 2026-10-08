import { useCallback, useEffect, useState } from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../context/ToastContext";
import {
  coordinatorApproveStudentRequest,
  coordinatorListPendingStudentsRequest,
  coordinatorRejectStudentRequest,
} from "../../services/authService";
import LoadingSpinner from "../../components/LoadingSpinner";
import useAuth from "../../hooks/useAuth";

// ── Pending students table ────────────────────────────────────────────────────
const PendingStudentsTable = ({ users, onApprove, onReject, actionLoading }) => {
  if (!users.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-slate-400">No pending student registrations.</p>
        <p className="mt-1 text-xs text-slate-300">
          New student sign-ups will appear here for your review.
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
              Registered
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
              <td className="py-3 pr-6 text-xs text-slate-400">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => onApprove(u.id)}
                    className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === u.id}
                    onClick={() => onReject(u.id)}
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
const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPendingStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await coordinatorListPendingStudentsRequest();
      setPendingStudents(data.users);
    } catch {
      showToast("Failed to load pending students", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPendingStudents();
  }, [fetchPendingStudents]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await coordinatorApproveStudentRequest(id);
      showToast("Student approved", "success");
      fetchPendingStudents();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await coordinatorRejectStudentRequest(id);
      showToast("Student rejected", "success");
      fetchPendingStudents();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-sm font-medium text-indigo-600">Coordinator Dashboard</p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Welcome, {user?.name}
        </h2>
        <p className="mt-2 text-slate-500">
          Review and approve student registrations for your department.
        </p>
      </section>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pending Approvals
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {loading ? "—" : pendingStudents.length}
          </p>
        </div>
      </div>

      {/* Students table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Students Awaiting Approval
          </h3>
          <button
            type="button"
            onClick={fetchPendingStudents}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading students..." />
        ) : (
          <PendingStudentsTable
            users={pendingStudents}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
