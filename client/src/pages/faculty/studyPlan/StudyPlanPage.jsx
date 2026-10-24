import { useEffect, useState } from 'react';
import { BookOpenIcon, DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import {
  createFacultyStudyPlan,
  getFacultyProfile,
  getFacultyStudyPlans,
  publishFacultyStudyPlan,
} from '../../../services/facultyService';

const INITIAL = { assignmentId: '', division: '', title: '', description: '', fileName: '', fileUrl: '' };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const getError = (error) => error?.response?.data?.message || error?.message || 'Request failed.';
const divisionLetter = (value) => String(value || '').match(/\b([A-Z])\b/i)?.[1]?.toUpperCase() || '';

const StudyPlanPage = () => {
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [profileResponse, plansResponse] = await Promise.all([getFacultyProfile(), getFacultyStudyPlans()]);
      const assignments = profileResponse.data?.faculty?.subjectAssignments || [];
      setSubjectAssignments(assignments);
      setPlans(plansResponse.data?.studyPlans || []);
      setForm((current) => ({ ...current, assignmentId: current.assignmentId || String(assignments[0]?.id || '') }));
    } catch (loadError) { setError(getError(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selectedAssignment = subjectAssignments.find((row) => String(row.id) === form.assignmentId);
  const fixedDivision = divisionLetter(selectedAssignment?.division);
  const availableDivisions = fixedDivision ? [fixedDivision] : ['A', 'B', 'C'];
  const setField = (event) => {
    const { name, value } = event.target;
    if (name === 'assignmentId') {
      const match = subjectAssignments.find((row) => String(row.id) === value);
      setForm((current) => ({ ...current, assignmentId: value, division: divisionLetter(match?.division) }));
    } else setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
  };

  const submit = async (event, publish) => {
    event.preventDefault();
    if (!selectedAssignment) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await createFacultyStudyPlan({
        subjectId: selectedAssignment.subjectId,
        academicYear: selectedAssignment.academicYear,
        division: form.division || null,
        title: form.title,
        description: form.description,
        fileName: form.fileName || null,
        fileUrl: form.fileUrl || null,
        status: publish ? 'PUBLISHED' : 'DRAFT',
      });
      setForm((current) => ({ ...INITIAL, assignmentId: current.assignmentId, division: current.division }));
      setMessage(publish ? 'Study plan published to its eligible students.' : 'Draft saved.');
      await load();
    } catch (saveError) { setError(getError(saveError)); }
    finally { setSaving(false); }
  };

  const publishExisting = async (id) => {
    setPublishingId(String(id)); setError(''); setMessage('');
    try { await publishFacultyStudyPlan(id); setMessage('Study plan published to its eligible students.'); await load(); }
    catch (publishError) { setError(getError(publishError)); }
    finally { setPublishingId(''); }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Study Plans" breadcrumbs={[{ label: 'Home', href: '/dashboard/faculty' }, { label: 'Study Plan' }]} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={load} className="ml-3 font-semibold underline">Retry</button></p>}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900"><BookOpenIcon className="h-5 w-5 text-blue-600" />Create study plan</h2><p className="mb-4 text-xs text-slate-500">Published plans become visible to students in the matching academic group. Provide an HTTPS document link if a stored file already exists.</p>
          {!subjectAssignments.length && !loading ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No assigned subjects are available for this faculty account.</p> : <form className="space-y-3" onSubmit={(event) => submit(event, false)}>
            <label className="block text-xs font-medium text-slate-700">Assigned subject<select name="assignmentId" required value={form.assignmentId} onChange={setField} className={inputClass}><option value="">Select subject assignment</option>{subjectAssignments.map((row) => <option key={row.id} value={row.id}>{row.subject?.subjectCode} — {row.subject?.subjectName} · {row.academicYear}{row.division ? ` · Div ${divisionLetter(row.division)}` : ''}</option>)}</select></label>
            {availableDivisions.length > 1 && <label className="block text-xs font-medium text-slate-700">Division scope<select name="division" value={form.division} onChange={setField} className={inputClass}><option value="">All divisions for this subject</option>{availableDivisions.map((division) => <option key={division} value={division}>Division {division}</option>)}</select></label>}
            <label className="block text-xs font-medium text-slate-700">Title<input name="title" required maxLength={180} value={form.title} onChange={setField} className={inputClass} /></label>
            <label className="block text-xs font-medium text-slate-700">Description<textarea name="description" rows={3} value={form.description} onChange={setField} className={inputClass} /></label>
            <label className="block text-xs font-medium text-slate-700">Document URL (optional, HTTPS)<input name="fileUrl" type="url" value={form.fileUrl} onChange={setField} placeholder="https://…" className={inputClass} /></label>
            <label className="block text-xs font-medium text-slate-700">Document name<input name="fileName" value={form.fileName} onChange={setField} className={inputClass} /></label>
            <div className="grid grid-cols-2 gap-3 pt-2"><button type="submit" onClick={(event) => { event.preventDefault(); submit(event, false); }} disabled={saving || !selectedAssignment} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save draft'}</button><button type="button" onClick={(event) => submit(event, true)} disabled={saving || !selectedAssignment || !form.title.trim()} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Publish to students'}</button></div>
          </form>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-900">Saved study plans</h2>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading study plans…</p> : plans.length === 0 ? <p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">No study plans have been saved.</p> : <div className="space-y-3">{plans.map((plan) => <article key={plan.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><DocumentTextIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><h3 className="text-sm font-semibold text-slate-900">{plan.title}</h3><p className="mt-1 text-xs text-slate-600">{plan.subject?.subjectCode} — {plan.subject?.subjectName}</p><p className="text-xs text-slate-500">{plan.academicYear} · {plan.year} · Semester {plan.semester}{plan.division ? ` · Division ${divisionLetter(plan.division)}` : ' · All divisions'} · Version {plan.version}</p><p className="mt-1 text-xs font-semibold text-slate-600">{plan.status}</p></div></div>{plan.status === 'DRAFT' && <button type="button" disabled={publishingId === String(plan.id)} onClick={() => publishExisting(plan.id)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{publishingId === String(plan.id) ? 'Publishing…' : 'Publish'}</button>}</div>{plan.description && <p className="mt-3 whitespace-pre-wrap text-xs text-slate-600">{plan.description}</p>}{plan.fileUrl && <a href={plan.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><LinkIcon className="h-4 w-4" />{plan.fileName || 'Open document'}</a>}</article>)}</div>}
        </section>
      </div>
    </div>
  );
};

export default StudyPlanPage;
