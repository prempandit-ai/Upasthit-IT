import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import StatCard from '../../components/shared/StatCard';
import CoordinatorProfileCard from '../../components/coordinator/CoordinatorProfileCard';
import EventCarousel from '../../components/coordinator/EventCarousel';
import AttendanceChart from '../../components/coordinator/AttendanceChart';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  IdentificationIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  getCoordinatorDashboardStats,
  getEvents,
} from '../../services/coordinatorService';

const CoordinatorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, eventsRes] = await Promise.all([
          getCoordinatorDashboardStats(),
          getEvents(),
        ]);
        setDashboardData(statsRes);
        setEventsList(eventsRes);
      } catch (err) {
        console.error('Failed to load coordinator dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = dashboardData?.stats || {
    totalEvents: 12,
    totalParticipants: 356,
    totalFaculty: 48,
    todayEvents: 2,
    attendanceTakenRate: 68,
    attendanceBreakdown: { presentRate: 68, absentRate: 22, notMarkedRate: 10 },
  };

  const upcomingEvents = dashboardData?.upcomingEvents || eventsList.slice(0, 3);
  const recentRegistrations = dashboardData?.recentRegistrations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & Stats Grid ─────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Welcome, {user?.name || 'Coordinator'}!
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Here's what's happening today in campus events and operations.
          </p>
        </div>

        {/* Top split row: 5 Stat Cards on left, Event Carousel on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Stat Cards Grid (7 cols on lg) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              subtitle="Active Events"
              icon={CalendarDaysIcon}
              onClick={() => navigate('/dashboard/coordinator/events')}
            />
            <StatCard
              title="Total Participants"
              value={stats.totalParticipants}
              subtitle="Registered"
              icon={UserGroupIcon}
              onClick={() => navigate('/dashboard/coordinator/participants')}
            />
            <StatCard
              title="Total Faculty"
              value={stats.totalFaculty}
              subtitle="Mapped"
              icon={AcademicCapIcon}
              onClick={() => navigate('/dashboard/coordinator/faculty')}
            />
            <StatCard
              title="Today's Events"
              value={stats.todayEvents}
              subtitle="Scheduled"
              icon={ClockIcon}
              onClick={() => navigate('/dashboard/coordinator/events/calendar')}
            />
            <StatCard
              title="Attendance Taken"
              value={`${stats.attendanceTakenRate}%`}
              subtitle="Overall"
              icon={ClipboardDocumentCheckIcon}
              onClick={() => navigate('/dashboard/coordinator/attendance-mapping')}
              className="col-span-2 sm:col-span-1"
            />
          </div>

          {/* Event Carousel banner on right (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <EventCarousel
              events={eventsList.length > 0 ? eventsList : upcomingEvents}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* ── Middle Row: Coordinator Profile & About Section ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Coordinator Profile Card (4 cols on md) */}
        <div className="md:col-span-4 flex flex-col">
          <CoordinatorProfileCard className="h-full" />
        </div>

        {/* Right: About Co-ordinator Portal Card (8 cols on md) */}
        <div className="md:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              About Co-ordinator Portal
            </h3>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              Unified Campus Event Management & Attendance Operations
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              As an Event Coordinator, you oversee student activities, assign academic faculty,
              and coordinate attendance mapping across college departments:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Create and manage events with complete schedules & venues.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Define student eligibility criteria by department and year.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Add, view, and bulk-import registered participant rosters.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Assign qualified faculty members as per event requirement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Map faculty with responsibilities (In-charge, Discipline, etc.).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Map attendance tracking to assigned faculty members.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Monitor live event attendance and verify student presence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Generate printable participation & attendance reports.</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Upasthit Operational Suite • Event Coordination Module</span>
            <span className="font-semibold text-blue-700">Role: COORDINATOR</span>
          </div>
        </div>
      </div>

      {/* ── Quick Access (8 Shortcut Cards matching screenshot) ──────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. Create Event */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/events/create')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <PlusIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Create Event
            </span>
          </button>

          {/* 2. Eligibility */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/eligibility')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Eligibility
            </span>
          </button>

          {/* 3. Add Participants */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/participants/add')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <UserPlusIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Add Participants
            </span>
          </button>

          {/* 4. Participant List */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/participants')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <IdentificationIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Participant List
            </span>
          </button>

          {/* 5. Faculty List */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/faculty')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Faculty List
            </span>
          </button>

          {/* 6. Faculty Mapping */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/faculty/mapping')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Faculty Mapping
            </span>
          </button>

          {/* 7. Attend. Mapping */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/attendance-mapping')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Attend. Mapping
            </span>
          </button>

          {/* 8. Reports */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/reports')}
            className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs transition hover:border-blue-500 hover:shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
              Reports
            </span>
          </button>
        </div>
      </div>

      {/* ── Bottom Section: 3 Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* 1. Upcoming Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Upcoming Events
              </h4>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingEvents.map((evt) => (
                <div key={evt.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                    <CalendarDaysIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{evt.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {evt.startDate} • {evt.startTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/events')}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              View All Events
            </button>
          </div>
        </div>

        {/* 2. Recent Registrations */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Registrations
              </h4>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                New
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {recentRegistrations.map((reg) => (
                <div key={reg.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                    <UserGroupIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{reg.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Registered for {reg.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/participants')}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              View All Participants
            </button>
          </div>
        </div>

        {/* 3. Attendance Overview Donut Chart */}
        <AttendanceChart
          present={stats.attendanceBreakdown?.presentRate || 68}
          absent={stats.attendanceBreakdown?.absentRate || 22}
          notMarked={stats.attendanceBreakdown?.notMarkedRate || 10}
          overallRate={`${stats.attendanceTakenRate || 68}%`}
          onViewReport={() => navigate('/dashboard/coordinator/reports')}
        />
      </div>
    </div>
  );
};

export default CoordinatorDashboardPage;
