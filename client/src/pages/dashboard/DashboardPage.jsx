import { useEffect, useState } from "react";
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import ProfileCard from "../../components/ProfileCard";
import StatCard from "../../components/StatCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import useAuth from "../../hooks/useAuth";
import { verifyRoleRoute } from "../../services/authService";
import { isTokenExpired } from "../../utils/token";
import { ROLE_LABELS } from "../../utils/roleRoutes";

const iconMap = {
  STUDENT: ClipboardDocumentCheckIcon,
  FACULTY: UserGroupIcon,
  HOD: ChartBarIcon,
  COORDINATOR: AcademicCapIcon,
};

const featureMap = {
  STUDENT: ["Attendance", "Leave", "Assignments"],
  FACULTY: ["Mark Attendance", "Students", "Assignments"],
  HOD: ["Faculty Reports", "Analytics", "Departments"],
  COORDINATOR: ["Timetable", "Faculty", "Subjects"],
};

const DashboardPage = ({ role }) => {
  const { user, token, tokenExpiry, setRbacStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [protectedRouteStatus, setProtectedRouteStatus] = useState("Checking...");
  const Icon = iconMap[role];

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        await verifyRoleRoute(role);
        setProtectedRouteStatus("Verified");
        setRbacStatus("Verified");
      } catch {
        setProtectedRouteStatus("Denied");
        setRbacStatus("Denied");
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [role, setRbacStatus]);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  const jwtValid = Boolean(token && !isTokenExpired(token));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-indigo-600">
          {ROLE_LABELS[role]} Dashboard
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Welcome, {user?.name}
        </h2>
        <p className="mt-2 text-slate-500">
          Manage your academic workflow from your role-specific workspace.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProfileCard
            user={user}
            tokenExpiry={tokenExpiry}
            jwtValid={jwtValid}
            protectedRouteStatus={protectedRouteStatus}
          />
        </div>

        <StatCard
          title="Role Access"
          value={ROLE_LABELS[role]}
          subtitle="Current active session role"
          icon={Icon}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {featureMap[role].map((feature, index) => (
          <div
            key={feature}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Module {index + 1}
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{feature}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Quick access placeholder for {feature.toLowerCase()} workflows.
            </p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardPage;
