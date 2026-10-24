import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import { getTodaySchedule } from '../../../services/facultyService';

const getError = (error) => error?.response?.data?.message || error?.message || 'Unable to load today’s schedule.';
const timeLabel = (value) => {
  if (!value) return '—';
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};
const getDuration = (row) => {
  if (!row.startTime || !row.endTime) return 0;
  const [startHour, startMinute] = row.startTime.split(':').map(Number);
  const [endHour, endMinute] = row.endTime.split(':').map(Number);
  return Math.max(0, (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60);
};

const TodaySchedule = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await getTodaySchedule();
      setSchedule(response.data?.schedule || []);
    } catch (loadError) { setError(getError(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const lectures = schedule.filter((row) => row.sessionType === 'LECTURE').length;
  const labs = schedule.filter((row) => row.sessionType === 'LAB').length;
  const teachingHours = schedule.reduce((total, row) => total + getDuration(row), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Today’s Schedule" breadcrumbs={[{ label: 'Home', href: '/dashboard/faculty' }, { label: 'Schedule', href: '/dashboard/faculty/schedule/manage' }, { label: 'Today' }]} actions={<button type="button" onClick={() => navigate('/dashboard/faculty/attendance/take')} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white"><PlusIcon className="h-4 w-4" />Take Attendance</button>} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={load} className="ml-3 font-semibold underline">Retry</button></p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Classes today</p><p className="mt-1 text-2xl font-bold">{loading ? '—' : schedule.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Lectures / Labs</p><p className="mt-1 text-2xl font-bold">{loading ? '—' : `${lectures} / ${labs}`}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">Scheduled teaching hours</p><p className="mt-1 text-2xl font-bold text-blue-700">{loading ? '—' : teachingHours.toFixed(1)}</p></div></div>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-900">Scheduled sessions today</h2>{loading ? <p className="py-8 text-center text-sm text-slate-500">Loading schedule…</p> : schedule.length === 0 ? <div className="py-10 text-center"><CalendarDaysIcon className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-700">No timetable sessions today</p><p className="text-xs text-slate-500">Manage confirmed sessions in My Schedule.</p></div> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-left text-xs text-slate-700"><thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Class / Batch</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{schedule.map((row) => <tr key={row.id}><td className="whitespace-nowrap px-4 py-3 font-mono">{timeLabel(row.startTime)} – {timeLabel(row.endTime)}</td><td className="px-4 py-3 font-semibold">{row.subject}</td><td className="px-4 py-3"><StatusBadge status={row.sessionType || 'Session'} /></td><td className="px-4 py-3">{row.classGroup}{row.labBatch ? ` · ${row.labBatch}` : ''}<span className="block text-slate-500">{row.academicYear}</span></td><td className="px-4 py-3">{row.room || 'Not specified'}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3 text-right"><button type="button" onClick={() => navigate('/dashboard/faculty/attendance/take')} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium">Take Attendance</button></td></tr>)}</tbody></table></div>}</section>
    </div>
  );
};

export default TodaySchedule;
