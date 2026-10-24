import { useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import {
  createAssignment,
  getAssignmentSubmissions,
  getAssignments,
  getFacultyProfile,
  reviewAssignmentSubmission,
} from '../../../services/facultyService';

const NEW_ASSIGNMENT = { assignmentId: '', division: '', labBatch: '', title: '', description: '', dueAt: '', maxMarks: '', attachmentName: '', attachmentUrl: '', publish: true };
const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const errorText = (error) => error?.response?.data?.message || error?.message || 'Request failed.';
const divisionLetter = (value) => String(value || '').match(/\b([A-Z])\b/i)?.[1]?.toUpperCase() || '';
const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not set';

const AssignmentsPage = ({ defaultTab = 'All' }) => {
  const [assignments, setAssignments] = useState([]);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [tab, setTab] = useState(String(defaultTab).toLowerCase() === 'submissions' ? 'submissions' : 'assignments');
  const [filter, setFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(NEW_ASSIGNMENT);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [assignmentResponse, profileResponse] = await Promise.all([getAssignments(), getFacultyProfile()]);
      const rows = assignmentResponse.data?.assignments || [];
      const assigned = profileResponse.data?.faculty?.subjectAssignments || [];
      setAssignments(rows);
      setSubjectAssignments(assigned);
      setForm((current) => ({ ...current, assignmentId: current.assignmentId || String(assigned[0]?.id || '') }));
    } catch (loadError) { setError(errorText(loadError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const assignedSubject = subjectAssignments.find((row) => String(row.id) === form.assignmentId);
  const fixedDivision = divisionLetter(assignedSubject?.division);
  const possibleDivisions = fixedDivision ? [fixedDivision] : ['A', 'B', 'C'];
  const batchOptions = form.division === 'A' ? ['A1', 'A2', 'A3'] : form.division === 'B' ? ['B1', 'B2', 'B3'] : [];
  const visibleAssignments = useMemo(() => assignments.filter((item) => filter === 'All' || item.status === filter), [assignments, filter]);
  const submissionTotal = assignments.reduce((total, item) => total + Number(item.submissionsCount || 0), 0);
  const publishedTotal = assignments.filter((item) => item.status === 'PUBLISHED').length;

  const changeForm = (event) => {
    const { name, value, type, checked } = event.target;
    setMessage('');
    if (name === 'assignmentId') {
      const selected = subjectAssignments.find((row) => String(row.id) === value);
      setForm((current) => ({ ...current, assignmentId: value, division: divisionLetter(selected?.division), labBatch: '' }));
    } else setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value, ...(name === 'division' || (name === 'assignmentId') ? { labBatch: '' } : {}) }));
  };

  const create = async (event) => {
    event.preventDefault();
    if (!assignedSubject) return;
    setSaving(true); setError(''); setMessage('');
    try {
      await createAssignment({
        subjectId: assignedSubject.subjectId,
        academicYear: assignedSubject.academicYear,
        year: assignedSubject.subject.year,
        semester: assignedSubject.subject.semester,
        division: form.division || null,
        labBatch: form.labBatch || null,
        title: form.title,
        description: form.description,
        dueAt: new Date(form.dueAt).toISOString(),
        maxMarks: form.maxMarks === '' ? null : Number(form.maxMarks),
        attachmentName: form.attachmentName || null,
        attachmentUrl: form.attachmentUrl || null,
        status: form.publish ? 'PUBLISHED' : 'DRAFT',
      });
      setMessage(form.publish ? 'Assignment published and eligible students were notified.' : 'Assignment draft saved.');
      setForm((current) => ({ ...NEW_ASSIGNMENT, assignmentId: current.assignmentId }));
      setFormOpen(false);
      await load();
    } catch (saveError) { setError(errorText(saveError)); }
    finally { setSaving(false); }
  };

  const loadSubmissions = async (assignment) => {
    setSelectedAssignment(assignment); setTab('submissions'); setError(''); setSubmissions([]);
    try {
      const response = await getAssignmentSubmissions(assignment.id);
      const rows = response.data?.submissions || [];
      setSubmissions(rows);
      setReviewDrafts(Object.fromEntries(rows.map((row) => [row.id, { marks: row.marks ?? '', feedback: row.feedback || '', release: row.feedbackReleased || false }])));
    } catch (loadError) { setError(errorText(loadError)); }
  };

  const saveReview = async (submission) => {
    const draft = reviewDrafts[submission.id] || {};
    setReviewingId(String(submission.id)); setError(''); setMessage('');
    try {
      await reviewAssignmentSubmission(selectedAssignment.id, submission.id, { marks: draft.marks === '' ? null : Number(draft.marks), feedback: draft.feedback, release: Boolean(draft.release) });
      setMessage(draft.release ? 'Review saved and released to the student.' : 'Review saved.');
      await loadSubmissions(selectedAssignment);
    } catch (reviewError) { setError(errorText(reviewError)); }
    finally { setReviewingId(''); }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Assignments" breadcrumbs={[{ label: 'Home', href: '/dashboard/faculty' }, { label: 'Assignments' }]} actions={<button type="button" onClick={() => { setFormOpen((current) => !current); setTab('assignments'); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"><PlusIcon className="h-4 w-4" />New assignment</button>} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={load} className="ml-3 font-semibold underline">Retry</button></p>}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      {formOpen && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-base font-semibold text-slate-900">Create assignment</h2>
        {!subjectAssignments.length ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">No assigned subjects are available for this faculty account.</p> : <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-slate-700">Assigned subject<select name="assignmentId" value={form.assignmentId} onChange={changeForm} required className={inputClass}><option value="">Select subject assignment</option>{subjectAssignments.map((row) => <option key={row.id} value={row.id}>{row.subject?.subjectCode} — {row.subject?.subjectName} · {row.academicYear}{row.division ? ` · Div ${divisionLetter(row.division)}` : ''}</option>)}</select></label>
          {possibleDivisions.length > 1 && <label className="text-xs font-medium text-slate-700">Target division<select name="division" value={form.division} onChange={changeForm} className={inputClass}><option value="">All divisions</option>{possibleDivisions.map((division) => <option key={division} value={division}>Division {division}</option>)}</select></label>}
          <label className="text-xs font-medium text-slate-700">Lab batch (optional)<select name="labBatch" value={form.labBatch} onChange={changeForm} disabled={!batchOptions.length} className={inputClass}><option value="">All batches</option>{batchOptions.map((batch) => <option key={batch}>{batch}</option>)}</select></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">Title<input name="title" value={form.title} onChange={changeForm} required maxLength={180} className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Due date and time<input name="dueAt" type="datetime-local" value={form.dueAt} onChange={changeForm} required className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Maximum marks (optional)<input name="maxMarks" type="number" min="0" step="0.01" value={form.maxMarks} onChange={changeForm} className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700">Attachment name<input name="attachmentName" value={form.attachmentName} onChange={changeForm} className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">Attachment URL (optional, HTTPS)<input name="attachmentUrl" type="url" value={form.attachmentUrl} onChange={changeForm} placeholder="https://…" className={inputClass} /></label>
          <label className="text-xs font-medium text-slate-700 sm:col-span-3">Description<textarea name="description" rows={3} value={form.description} onChange={changeForm} className={inputClass} /></label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input name="publish" type="checkbox" checked={form.publish} onChange={changeForm} />Publish immediately</label>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold">Cancel</button><button type="submit" disabled={saving || !assignedSubject} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : form.publish ? 'Publish assignment' : 'Save draft'}</button></div>
        </form>}
      </section>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Assignments</p><p className="mt-1 text-2xl font-bold text-slate-900">{loading ? '—' : assignments.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Published</p><p className="mt-1 text-2xl font-bold text-blue-700">{loading ? '—' : publishedTotal}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Submissions recorded</p><p className="mt-1 text-2xl font-bold text-emerald-700">{loading ? '—' : submissionTotal}</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setTab('assignments')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'assignments' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white'}`}>Assignments</button><button type="button" onClick={() => setTab('submissions')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'submissions' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white'}`}>Submissions</button>{tab === 'assignments' && <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="All">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select>}</div>

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</p> : tab === 'assignments' ? visibleAssignments.length ? <div className="space-y-3">{visibleAssignments.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{item.title}</h2><p className="mt-1 text-xs text-slate-600">{item.subject?.subjectCode} — {item.subject?.subjectName} · {item.academicYear} · {item.year} · Sem {item.semester}{item.division ? ` · Div ${divisionLetter(item.division)}` : ' · All divisions'}{item.labBatch ? ` · ${item.labBatch}` : ''}</p><p className="mt-1 text-xs text-slate-500">Due {formatDate(item.dueAt)} · {item.submissionsCount || 0} submissions · {item.status}</p></div><button type="button" onClick={() => loadSubmissions(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">View submissions</button></div>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>}{item.attachmentUrl && <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700">{item.attachmentName || 'Open assignment attachment'}</a>}</article>)}</div> : <div className="rounded-xl border border-slate-200 bg-white p-10 text-center"><ClipboardDocumentListIcon className="mx-auto h-9 w-9 text-slate-400" /><p className="mt-2 text-sm font-semibold text-slate-700">No assignments found</p></div> : !selectedAssignment ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Select “View submissions” on an assignment to load its genuine student submissions.</div> : <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Submissions: {selectedAssignment.title}</h2><p className="text-xs text-slate-500">{submissions.length} submitted records</p></div><button type="button" onClick={() => loadSubmissions(selectedAssignment)} className="text-xs font-semibold text-blue-700">Refresh</button></div>{submissions.length === 0 ? <p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">No submissions recorded.</p> : <div className="space-y-3">{submissions.map((submission) => { const draft = reviewDrafts[submission.id] || {}; return <article key={submission.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">{submission.name} <span className="font-normal text-slate-500">({submission.studentId}, roll {submission.rollNo ?? 'not set'})</span></h3><p className="text-xs text-slate-500">Submitted {formatDate(submission.submittedAt)}</p></div><span className="text-xs font-semibold text-slate-600">{submission.feedbackReleased ? 'Feedback released' : 'Awaiting review'}</span></div>{submission.responseText && <p className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm">{submission.responseText}</p>}{submission.attachmentUrl && <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 block text-xs font-semibold text-blue-700">{submission.attachmentName || 'Open submission attachment'}</a>}<div className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr_auto]"><label className="text-xs font-medium text-slate-700">Marks<input type="number" min="0" max={selectedAssignment.maxMarks ?? undefined} step="0.01" value={draft.marks ?? ''} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, marks: event.target.value } }))} className={inputClass} /></label><label className="text-xs font-medium text-slate-700">Feedback<textarea rows={2} value={draft.feedback || ''} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, feedback: event.target.value } }))} className={inputClass} /></label><div className="flex flex-col justify-end gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={Boolean(draft.release)} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: { ...draft, release: event.target.checked } }))} />Release</label><button type="button" disabled={reviewingId === String(submission.id)} onClick={() => saveReview(submission)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{reviewingId === String(submission.id) ? 'Saving…' : 'Save review'}</button></div></div></article>; })}</div>}</section>}
    </div>
  );
};

export default AssignmentsPage;
