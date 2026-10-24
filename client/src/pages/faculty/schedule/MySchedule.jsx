import { useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import {
  createFacultyTimetableEntry,
  deleteFacultyTimetableEntry,
  getFacultyProfile,
  getFacultyTimetable,
} from '../../../services/facultyService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_FORM = { assignmentId: '', division: '', labBatch: '', sessionType: 'LECTURE', dayOfWeek: '1', startTime: '', endTime: '', room: '' };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

function getError(error) { return error?.response?.data?.message || error?.message || 'Request failed.'; }
function letter(value) { return String(value || '').match(/\b([A-Z])\b/i)?.[1]?.toUpperCase() || ''; }
function timeLabel(value) {
  if (!value) return 'Time unavailable';
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

const MySchedule = () => {
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [view, setView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(String(new Date().getDay() || 7));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileResponse, timetableResponse] = await Promise.all([getFacultyProfile(), getFacultyTimetable()]);
      const assignments = profileResponse.data?.faculty?.subjectAssignments || [];
      setSubjectAssignments(assignments);
      setEntries(timetableResponse.data?.entries || []);
      setForm((current) => ({ ...current, assignmentId: current.assignmentId || String(assignments[0]?.id || '') }));
    } catch (loadError) { setError(getError(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedAssignment = subjectAssignments.find((row) => String(row.id) === form.assignmentId);
  const fixedDivision = letter(selectedAssignment?.division);
  const divisions = fixedDivision ? [fixedDivision] : ['A', 'B', 'C'];
  const availableBatches = form.division === 'A' ? ['A1', 'A2', 'A3'] : form.division === 'B' ? ['B1', 'B2', 'B3'] : [];
  const visibleEntries = useMemo(() => view === 'day' ? entries.filter((entry) => String(entry.dayOfWeek) === selectedDay) : entries, [entries, view, selectedDay]);
  const orderedEntries = useMemo(() => [...visibleEntries].sort((left, right) => left.dayOfWeek - right.dayOfWeek || left.startTime.localeCompare(right.startTime)), [visibleEntries]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSuccess('');
    setForm((current) => ({ ...current, [name]: value, ...(name === 'sessionType' && value !== 'LAB' ? { labBatch: '' } : {}), ...(name === 'division' ? { labBatch: '' } : {}) }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!selectedAssignment) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await createFacultyTimetableEntry({
        subjectId: selectedAssignment.subjectId,
        academicYear: selectedAssignment.academicYear,
        year: selectedAssignment.subject.year,
        semester: selectedAssignment.subject.semester,
        division: form.division,
        labBatch: form.sessionType === 'LAB' ? form.labBatch : null,
        sessionType: form.sessionType,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room,
      });
      setSuccess('Timetable entry saved.');
      setForm((current) => ({ ...DEFAULT_FORM, assignmentId: current.assignmentId }));
      await load();
    } catch (saveError) { setError(getError(saveError)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this timetable entry?')) return;
    setError('');
    try { await deleteFacultyTimetableEntry(id); setEntries((current) => current.filter((entry) => String(entry.id) !== String(id))); }
    catch (deleteError) { setError(getError(deleteError)); }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="My Schedule" breadcrumbs={[{ label: 'Home', href: '/dashboard/faculty' }, { label: 'Schedule' }, { label: 'My Schedule' }]} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={load} className="ml-3 font-semibold underline">Retry</button></p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">Weekly timetable</h2><p className="text-xs text-slate-500">Entries are saved for the academic group and subject on the faculty assignment.</p></div><div className="flex gap-2"><button type="button" onClick={() => setView('week')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === 'week' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`}>Week</button><button type="button" onClick={() => setView('day')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === 'day' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-700'}`}>Day</button></div></div>
        {view === 'day' && <label className="mb-4 block max-w-xs text-xs font-medium text-slate-700">Day<select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} className={inputClass}>{DAYS.map((day, index) => <option key={day} value={String(index + 1)}>{day}</option>)}</select></label>}
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading timetable…</p> : orderedEntries.length === 0 ? <div className="rounded-lg bg-slate-50 p-8 text-center"><CalendarDaysIcon className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-700">No timetable entries configured</p><p className="text-xs text-slate-500">Create an entry below when you have a confirmed schedule.</p></div> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-3">Day</th><th className="px-3 py-3">Time</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Class</th><th className="px-3 py-3">Room</th><th className="px-3 py-3">Type</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{orderedEntries.map((entry) => <tr key={entry.id}><td className="px-3 py-3">{DAYS[entry.dayOfWeek - 1]}</td><td className="whitespace-nowrap px-3 py-3">{timeLabel(entry.startTime)} – {timeLabel(entry.endTime)}</td><td className="px-3 py-3 font-semibold">{entry.subject?.subjectName || 'Subject unavailable'}<span className="block text-slate-500">{entry.subject?.subjectCode}</span></td><td className="px-3 py-3">{entry.academicYear} · {entry.year} · Sem {entry.semester} · Div {entry.division}{entry.labBatch ? ` · ${entry.labBatch}` : ''}</td><td className="px-3 py-3">{entry.room || 'Not specified'}</td><td className="px-3 py-3">{entry.sessionType}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => handleDelete(entry.id)} aria-label="Remove timetable entry" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900"><PlusIcon className="h-5 w-5 text-blue-600" />Add timetable entry</h2>
        {!subjectAssignments.length && !loading ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No subject assignments are available for this faculty account.</p> : <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-slate-700">Assigned subject<select name="assignmentId" value={form.assignmentId} onChange={handleChange} required className={inputClass}><option value="">Select subject assignment</option>{subjectAssignments.map((row) => <option key={row.id} value={row.id}>{row.subject?.subjectCode} — {row.subject?.subjectName} · {row.academicYear}{row.division ? ` · Div ${letter(row.division)}` : ''}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-700">Division<select name="division" value={form.division} onChange={handleChange} required className={inputClass}><option value="">Select division</option>{divisions.map((division) => <option key={division} value={division}>Division {division}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-700">Session type<select name="sessionType" value={form.sessionType} onChange={handleChange} className={inputClass}><option value="LECTURE">Lecture</option><option value="LAB">Lab</option><option value="TUTORIAL">Tutorial</option></select></label>
          {form.sessionType === 'LAB' && <label className="text-xs font-medium text-slate-700">Lab batch<select name="labBatch" value={form.labBatch} onChange={handleChange} required className={inputClass}><option value="">Select batch</option>{availableBatches.map((batch) => <option key={batch}>{batch}</option>)}</select></label>}
          <label className="text-xs font-medium text-slate-700">Day<select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} className={inputClass}>{DAYS.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-700">Start time<input name="startTime" type="time" value={form.startTime} onChange={handleChange} required className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">End time<input name="endTime" type="time" value={form.endTime} onChange={handleChange} required className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Room (optional)<input name="room" value={form.room} onChange={handleChange} className={inputClass} /></label>
          <div className="flex items-end"><button type="submit" disabled={saving || !selectedAssignment} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save timetable entry'}</button></div>
        </form>}
      </section>
    </div>
  );
};

export default MySchedule;
