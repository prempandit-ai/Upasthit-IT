import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowUpTrayIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import WelcomeHeader from '../../components/faculty/WelcomeHeader';
import FacultyStatCard from '../../components/faculty/FacultyStatCard';
import TodayClassCard from '../../components/faculty/TodayClassCard';
import QuickActionCard from '../../components/faculty/QuickActionCard';
import FacultyProfileCard from '../../components/faculty/FacultyProfileCard';
import ScheduleItem from '../../components/faculty/ScheduleItem';
import NotificationItem from '../../components/faculty/NotificationItem';
import AttendanceOverview from '../../components/faculty/AttendanceOverview';

import {
  getFacultyDashboardStats,
  getTodayClasses,
  getTodaySchedule,
  getFacultyNotifications,
  getAttendanceSummary,
} from '../../services/facultyService';
import { verifyRoleRoute } from '../../services/authService';

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
);

// ─── Error block ──────────────────────────────────────────────────────────────

const SectionError = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
    <p className="text-sm text-red-600">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
      >
        <ArrowPathIcon className="h-3.5 w-3.5" />
        Retry
      </button>
    )}
  </div>
);

// ─── Quick actions config ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Take Attendance',
    icon: ClipboardDocumentCheckIcon,
    href: '/dashboard/faculty/attendance/take',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-700',
  },
  {
    label: 'Upload Assignment',
    icon: ArrowUpTrayIcon,
    href: '/dashboard/faculty/assignments/upload',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-700',
  },
  {
    label: 'View Schedule',
    icon: CalendarDaysIcon,
    href: '/dashboard/faculty/schedule/today',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
  {
    label: 'Upload Study Plan',
    icon: AcademicCapIcon,
    href: '/dashboard/faculty/study-plan/upload',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-700',
  },
  {
    label: 'Make Announcement',
    icon: MegaphoneIcon,
    href: '/dashboard/faculty/campus/announcements',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
  {
    label: 'View Reports',
    icon: ChartBarIcon,
    href: '/dashboard/faculty/reports',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-700',
  },
];

// ─── Main dashboard ───────────────────────────────────────────────────────────

const FacultyDashboard = () => {
  const navigate = useNavigate();

  // ── Access verification (RBAC) ──
  const [rbacLoading, setRbacLoading] = useState(true);

  // ── API data states ──
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [todayClasses, setTodayClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);

  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceClasses, setAttendanceClasses] = useState([]);

  // ── RBAC check ──
  useEffect(() => {
    verifyRoleRoute('FACULTY')
      .catch(() => navigate('/unauthorized'))
      .finally(() => setRbacLoading(false));
  }, [navigate]);

  // ── Data fetchers (each fails gracefully) ──

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const { data } = await getFacultyDashboardStats();
      setStats(data);
    } catch {
      setStatsError('Unable to load dashboard statistics.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    setClassesLoading(true);
    setClassesError(null);
    try {
      const { data } = await getTodayClasses();
      setTodayClasses(data?.classes ?? data ?? []);
    } catch {
      setClassesError("Unable to load today's classes.");
    } finally {
      setClassesLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const { data } = await getTodaySchedule();
      setSchedule(data?.schedule ?? data ?? []);
    } catch {
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const { data } = await getFacultyNotifications();
      setNotifications(data?.notifications ?? data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const { data } = await getAttendanceSummary();
      setAttendanceSummary(data?.summary ?? null);
      setAttendanceClasses(data?.classes ?? []);
    } catch {
      // Silently show empty state
    }
  }, []);

  useEffect(() => {
    if (!rbacLoading) {
      fetchStats();
      fetchClasses();
      fetchSchedule();
      fetchNotifications();
      fetchAttendance();
    }
  }, [rbacLoading, fetchStats, fetchClasses, fetchSchedule, fetchNotifications, fetchAttendance]);

  if (rbacLoading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
      </div>
    );
  }

  // ── Stat card values (fall back to '—' when not loaded) ──
  const todayCount = stats?.todayClasses ?? (classesLoading ? null : todayClasses.length);
  const pendingCount = stats?.pendingAttendance ?? null;
  const leaveCount = stats?.leaveRequests ?? null;
  const eventsCount = stats?.upcomingEvents ?? null;

  return (
    <div className="space-y-6">
      {/* ── Welcome header ── */}
      <WelcomeHeader />

      {/* ── Quick Stats ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Quick Statistics
        </h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FacultyStatCard
              label="Today's Classes"
              value={todayCount ?? '—'}
              subtitle={pendingCount != null ? `${pendingCount} pending attendance` : undefined}
              icon={AcademicCapIcon}
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
            />
            <FacultyStatCard
              label="Pending Attendance"
              value={pendingCount ?? '—'}
              subtitle="Submit before class ends"
              icon={ClipboardDocumentCheckIcon}
              iconBg="bg-amber-50"
              iconColor="text-amber-700"
            />
            <FacultyStatCard
              label="Leave Requests"
              value={leaveCount ?? '—'}
              subtitle="Student requests pending"
              icon={DocumentTextIcon}
              iconBg="bg-rose-50"
              iconColor="text-rose-700"
            />
            <FacultyStatCard
              label="Upcoming Events"
              value={eventsCount ?? '—'}
              subtitle="This week"
              icon={CalendarDaysIcon}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
            />
          </div>
        )}
        {statsError && (
          <SectionError message={statsError} onRetry={fetchStats} />
        )}
      </section>

      {/* ── Today's Classes (most important section) ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Today&apos;s Classes
          </h2>
          <button
            type="button"
            onClick={() => navigate('/dashboard/faculty/schedule/today')}
            className="text-xs font-medium text-blue-700 hover:underline"
          >
            View full schedule →
          </button>
        </div>

        {classesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : classesError ? (
          <SectionError message={classesError} onRetry={fetchClasses} />
        ) : todayClasses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <AcademicCapIcon className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No classes scheduled for today.</p>
            <p className="text-xs text-slate-400">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {todayClasses.map((cls) => (
              <TodayClassCard
                key={cls.id}
                id={cls.id}
                subject={cls.subject}
                startTime={cls.startTime}
                endTime={cls.endTime}
                className={cls.class?.name ?? cls.className ?? ''}
                semester={cls.class?.semester ?? cls.semester ?? ''}
                division={cls.class?.division ?? cls.division ?? ''}
                room={cls.room}
                status={cls.attendanceStatus ?? 'UPCOMING'}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.label} {...action} />
          ))}
        </div>
      </section>

      {/* ── Two-column section: Schedule + Notifications ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today's Schedule */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Schedule</h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/faculty/schedule/today')}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              View all
            </button>
          </div>

          {scheduleLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : schedule.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No classes scheduled for today.
            </p>
          ) : (
            schedule.map((item, i) => (
              <ScheduleItem
                key={i}
                startTime={item.startTime}
                endTime={item.endTime}
                subject={item.subject}
                classGroup={item.classGroup ?? item.class ?? ''}
                room={item.room ?? ''}
                status={item.status ?? 'Upcoming'}
              />
            ))
          )}
        </section>

        {/* Recent Notifications */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Notifications</h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/faculty/campus/notifications')}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              View all
            </button>
          </div>

          {notifLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-sm font-medium text-slate-500">You&apos;re all caught up.</p>
              <p className="text-xs text-slate-400">No new notifications.</p>
            </div>
          ) : (
            <div className="-mx-2">
              {notifications.map((n, i) => (
                <NotificationItem
                  key={i}
                  title={n.title}
                  subtitle={n.subtitle ?? n.body}
                  time={n.time ?? n.createdAt}
                  unread={n.unread ?? false}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Three-column section: Profile + Attendance Overview ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Faculty profile card */}
        <div>
          <FacultyProfileCard />
        </div>

        {/* Attendance overview — spans 2 columns */}
        <div className="lg:col-span-2">
          <AttendanceOverview
            summary={attendanceSummary}
            classes={attendanceClasses}
          />
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
