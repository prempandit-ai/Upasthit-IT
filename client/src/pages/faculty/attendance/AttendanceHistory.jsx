import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';

const HISTORY_DATA = [
  { id: '1', date: '21 Aug 2025', type: 'Lecture', subject: 'Database Management Systems', batch: 'CSE Sem 3 - B', time: '09:00 AM - 10:00 AM', total: 58, present: 41, absent: 17, room: '306' },
  { id: '2', date: '19 Aug 2025', type: 'Lab', subject: 'DBMS Lab', batch: 'CSE Sem 3 - B', time: '02:00 PM - 05:00 PM', total: 28, present: 26, absent: 2, room: 'Lab 1' },
  { id: '3', date: '18 Aug 2025', type: 'Lecture', subject: 'Operating Systems', batch: 'CSE Sem 3 - A', time: '11:00 AM - 12:00 PM', total: 60, present: 55, absent: 5, room: '302' },
  { id: '4', date: '16 Aug 2025', type: 'Event', subject: 'Technical Workshop', batch: 'All CSE Students', time: '10:00 AM - 01:00 PM', total: 120, present: 98, absent: 22, room: 'Auditorium' },
  { id: '5', date: '14 Aug 2025', type: 'Lecture', subject: 'Database Management Systems', batch: 'CSE Sem 3 - B', time: '09:00 AM - 10:00 AM', total: 58, present: 48, absent: 10, room: '306' },
];

const AttendanceHistory = ({ defaultTab = 'all' }) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = HISTORY_DATA.filter((item) => {
    if (filterType !== 'All' && item.type.toLowerCase() !== filterType.toLowerCase()) return false;
    if (search && !item.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Attendance History"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Attendance' },
          { label: 'History' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/faculty/attendance/take')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Take Attendance
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Sessions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">42</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average Attendance</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">84.2%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Lectures Conducted</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">32</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Lab Sessions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">10</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All Types</option>
              <option value="Lecture">Lectures</option>
              <option value="Lab">Labs</option>
              <option value="Event">Events</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Subject / Event</th>
                <th className="px-4 py-3">Batch / Section</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.type} /></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{row.batch}</td>
                  <td className="px-4 py-3 text-slate-500">{row.room}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.total}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{row.present}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600">{row.absent}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      title="View Details"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
