import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import {
  getAttendanceHistory,
  getAttendanceErrorMessage,
} from '../../../services/facultyService';

const formatDisplayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AttendanceHistory = ({ defaultTab = 'all' }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterBatch, setFilterBatch] = useState('All');
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    averageAttendance: 0,
    lecturesConducted: 0,
    labSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getAttendanceHistory();
        if (cancelled) return;
        setSessions(data.sessions || []);
        setSummary({
          totalSessions: data.summary?.totalSessions || 0,
          averageAttendance: data.summary?.averageAttendance || 0,
          lecturesConducted: data.summary?.lecturesConducted || 0,
          labSessions: data.summary?.labSessions || 0,
        });
      } catch (error) {
        if (cancelled) return;
        setSessions([]);
        showToast(getAttendanceErrorMessage(error, 'Unable to load attendance history'), 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [showToast, defaultTab]);

  const subjectOptions = useMemo(
    () => Array.from(new Set(sessions.map((item) => item.subject).filter(Boolean))),
    [sessions]
  );
  const batchOptions = useMemo(
    () => Array.from(new Set(sessions.map((item) => item.batch).filter(Boolean))),
    [sessions]
  );

  const filtered = sessions.filter((item) => {
    const typeValue = filterType === 'All Types' || filterType === 'All' ? 'All' : filterType;
    if (typeValue !== 'All' && !String(item.type || '').toLowerCase().includes(typeValue.toLowerCase())) {
      return false;
    }
    if (filterSubject !== 'All' && item.subject !== filterSubject) return false;
    if (filterBatch !== 'All' && item.batch !== filterBatch) return false;
    if (search && !String(item.subject || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleReset = () => {
    setFilterType('All');
    setFilterSubject('All');
    setFilterBatch('All');
    setSearch('');
  };

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
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalSessions}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average Attendance</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.averageAttendance}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Lectures Conducted</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.lecturesConducted}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Lab Sessions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.labSessions}</p>
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

          <div className="flex flex-wrap items-center gap-2">
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
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              {batchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    Loading attendance history...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    No attendance sessions found yet.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{formatDisplayDate(row.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.type} /></td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.subject}</td>
                    <td className="px-4 py-3 text-slate-600">{row.batch}</td>
                    <td className="px-4 py-3 text-slate-500">{row.room || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.total}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{row.present}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{row.absent}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title={`View Details (${row.status || 'SESSION'})`}
                        onClick={() => navigate('/dashboard/faculty/attendance/take')}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
