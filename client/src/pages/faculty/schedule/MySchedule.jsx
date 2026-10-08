import { useState } from 'react';
import {
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import { useToast } from '../../../context/ToastContext';

// Color themes for subjects
const SUBJECT_COLORS = {
  'Data Structures': 'bg-blue-50 border-blue-200 text-blue-900',
  'DBMS': 'bg-amber-50 border-amber-200 text-amber-900',
  'Operating Systems': 'bg-emerald-50 border-emerald-200 text-emerald-900',
  'Computer Networks': 'bg-teal-50 border-teal-200 text-teal-900',
  'DBMS Lab': 'bg-purple-50 border-purple-200 text-purple-900',
};

const TIME_SLOTS = [
  '8:00 AM – 9:00 AM',
  '9:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 1:00 PM',
  '1:00 PM – 2:00 PM', // Lunch
  '2:00 PM – 3:00 PM',
  '3:00 PM – 4:00 PM',
  '4:00 PM – 5:00 PM',
  '5:00 PM – 6:00 PM',
];

const DAYS = [
  { name: 'Mon', date: '19 May' },
  { name: 'Tue', date: '20 May' },
  { name: 'Wed', date: '21 May' },
  { name: 'Thu', date: '22 May' },
  { name: 'Fri', date: '23 May' },
  { name: 'Sat', date: '24 May' },
  { name: 'Sun', date: '25 May' },
];

const SCHEDULE_GRID = {
  // 'dayIndex-slotIndex': { subject, batch, room, type }
  '0-1': { subject: 'Data Structures', batch: 'B.Tech CSE Sem 3', room: 'Room 305', type: 'Lecture' },
  '1-1': { subject: 'DBMS', batch: 'B.Tech CSE Sem 3', room: 'Room 310', type: 'Lecture' },
  '2-1': { subject: 'Data Structures', batch: 'B.Tech CSE Sem 3', room: 'Room 305', type: 'Lecture' },
  '3-1': { subject: 'Operating Systems', batch: 'B.Tech CSE Sem 3', room: 'Room 302', type: 'Lecture' },
  '4-1': { subject: 'DBMS', batch: 'B.Tech CSE Sem 3', room: 'Room 310', type: 'Lecture' },

  '0-3': { subject: 'Operating Systems', batch: 'B.Tech CSE Sem 3', room: 'Room 302', type: 'Lecture' },
  '1-3': { subject: 'Data Structures', batch: 'B.Tech CSE Sem 3', room: 'Room 305', type: 'Lecture' },
  '2-3': { subject: 'DBMS', batch: 'B.Tech CSE Sem 3', room: 'Room 310', type: 'Lecture' },
  '3-3': { subject: 'Data Structures', batch: 'B.Tech CSE Sem 3', room: 'Room 305', type: 'Lecture' },
  '4-3': { subject: 'Operating Systems', batch: 'B.Tech CSE Sem 3', room: 'Room 302', type: 'Lecture' },

  '0-6': { subject: 'DBMS Lab', batch: 'B.Tech CSE Sem 3', room: 'Lab 1', type: 'Lab' },
  '1-6': { subject: 'Computer Networks', batch: 'B.Tech CSE Sem 3', room: 'Room 303', type: 'Lecture' },
  '2-6': { subject: 'DBMS Lab', batch: 'B.Tech CSE Sem 3', room: 'Lab 1', type: 'Lab' },
  '3-6': { subject: 'DBMS', batch: 'B.Tech CSE Sem 3', room: 'Room 310', type: 'Lecture' },
  '4-6': { subject: 'Computer Networks', batch: 'B.Tech CSE Sem 3', room: 'Room 303', type: 'Lecture' },
};

const TODAY_CLASSES = [
  { time: '09:00 AM - 10:00 AM', subject: 'Data Structures', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 305' },
  { time: '11:00 AM - 12:00 PM', subject: 'DBMS', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 310' },
  { time: '02:00 PM - 05:00 PM', subject: 'DBMS Lab', type: 'Lab', batch: 'B.Tech CSE Sem 3', room: 'Lab 1' },
];

const UPCOMING_CLASSES = [
  { date: '22 May 2025 (Thu)', time: '09:00 AM - 10:00 AM', subject: 'Operating Systems', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 302' },
  { date: '22 May 2025 (Thu)', time: '11:00 AM - 12:00 PM', subject: 'Data Structures', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 305' },
  { date: '22 May 2025 (Thu)', time: '02:00 PM - 03:00 PM', subject: 'DBMS', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 310' },
  { date: '23 May 2025 (Fri)', time: '09:00 AM - 10:00 AM', subject: 'DBMS', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 310' },
  { date: '23 May 2025 (Fri)', time: '11:00 AM - 12:00 PM', subject: 'Operating Systems', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 302' },
];

const MySchedule = () => {
  const { showToast } = useToast();
  const [department, setDepartment] = useState('Computer Science');
  const [batch, setBatch] = useState('B.Tech CSE - Sem 3 (2024-28)');
  const [viewBy, setViewBy] = useState('Week View');

  const handleExport = () => {
    showToast('Schedule export started (PDF/Excel)', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Schedule"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Schedule' },
          { label: 'My Schedule' },
        ]}
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Schedule
          </button>
        }
      />

      {/* ── Controls Bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Week Selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Week</label>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-800">
              <button type="button" className="text-slate-400 hover:text-slate-600">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <span className="font-medium">19 May – 25 May 2025</span>
              <button type="button" className="text-slate-400 hover:text-slate-600">
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>Computer Science</option>
              <option>Information Technology</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch / Semester</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>B.Tech CSE - Sem 3 (2024-28)</option>
              <option>B.Tech CSE - Sem 5 (2023-27)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">View By</label>
            <select
              value={viewBy}
              onChange={(e) => setViewBy(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>Week View</option>
              <option>Day View</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Weekly Timetable Grid ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Weekly Timetable</h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                <th className="border-r border-slate-200 px-3 py-2.5 w-32">Time / Day</th>
                {DAYS.map((d) => (
                  <th key={d.name} className="border-r border-slate-200 px-3 py-2.5 text-center min-w-[130px]">
                    <div>{d.name}</div>
                    <div className="text-[10px] font-normal text-slate-400">{d.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TIME_SLOTS.map((slot, sIdx) => {
                const isLunch = sIdx === 5;
                if (isLunch) {
                  return (
                    <tr key={slot} className="bg-slate-100/70 border-y border-slate-200">
                      <td className="border-r border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-500">
                        {slot}
                      </td>
                      <td colSpan={7} className="px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                        Lunch Break
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot} className="hover:bg-slate-50/40 transition-colors">
                    <td className="border-r border-slate-200 px-3 py-3 text-[11px] font-medium text-slate-500 whitespace-nowrap align-top">
                      {slot}
                    </td>
                    {DAYS.map((d, dIdx) => {
                      const key = `${dIdx}-${sIdx}`;
                      const item = SCHEDULE_GRID[key];

                      return (
                        <td key={d.name} className="border-r border-slate-200 px-2 py-2 align-top h-20">
                          {item ? (
                            <div className={`h-full rounded-lg border p-2 shadow-xs transition hover:shadow-sm ${SUBJECT_COLORS[item.subject] || 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                              <p className="font-semibold text-xs leading-tight truncate">{item.subject}</p>
                              <p className="text-[10px] opacity-80 mt-1 leading-tight">{item.batch}</p>
                              <p className="text-[10px] font-medium opacity-90 mt-0.5">{item.room}</p>
                            </div>
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Today's Schedule — Wednesday, 21 May 2025 ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Today&apos;s Schedule — Wednesday, 21 May 2025
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Class / Batch</th>
                <th className="px-4 py-3">Room / Venue</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TODAY_CLASSES.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{c.time}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.subject}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.type} /></td>
                  <td className="px-4 py-3 text-slate-600">{c.batch}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{c.room}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Upcoming Classes ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Upcoming Classes</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Class / Batch</th>
                <th className="px-4 py-3">Room / Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {UPCOMING_CLASSES.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{c.date}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{c.time}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.subject}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.type} /></td>
                  <td className="px-4 py-3 text-slate-600">{c.batch}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{c.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Schedule Summary (Screenshot 3 bottom) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Classes / Week</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">16</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lectures: 12 | Labs: 4</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Subjects Assigned</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">4</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">DS, DBMS, OS, CN</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Next Class</p>
          <p className="text-base font-bold text-slate-900 mt-1">Today, 11:00 AM</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">DBMS (Room 310)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">This Week Workload</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">16 Hrs</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Teaching Hours</p>
        </div>
      </div>
    </div>
  );
};

export default MySchedule;
