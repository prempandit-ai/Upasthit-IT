import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import api from '../../../services/api';

const BATCHES_BY_DIVISION = { A: ['A1', 'A2', 'A3'], B: ['B1', 'B2', 'B3'] };

const ISSUE_LABELS = {
  MISSING_ROLL_NUMBER: 'Missing roll number',
  INVALID_ROLL_NUMBER: 'Invalid roll number',
  OUT_OF_RANGE_ROLL_NUMBER: 'Roll number outside 1–75',
  DUPLICATE_ROLL_NUMBER: 'Duplicate roll number in this year and division',
  INVALID_DIVISION: 'Division must be A or B',
};

const yearLabel = (year) => (year === 'TY' ? 'TE / TY (Third Year)' : year === 'BE' ? 'BE (Final Year)' : year);

const StudentBatchAllocationPage = () => {
  const { showToast } = useToast();
  const [academicYears, setAcademicYears] = useState([]);
  const [years, setYears] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [year, setYear] = useState('');
  const [division, setDivision] = useState('A');
  const [students, setStudents] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/coordinator/student-batches')
      .then(({ data }) => {
        if (cancelled) return;
        const nextAcademicYears = data.academicYears || [];
        const nextYears = data.years || [];
        setAcademicYears(nextAcademicYears);
        setYears(nextYears);
        setAcademicYear((current) => current || nextAcademicYears[0] || '');
        setYear((current) => current || (nextYears.includes('TY') ? 'TY' : nextYears[0] || ''));
      })
      .catch((error) => showToast(error.response?.data?.message || 'Unable to load student allocation options', 'error'))
      .finally(() => { if (!cancelled) setLoadingOptions(false); });
    return () => { cancelled = true; };
  }, [showToast]);

  const loadPreview = useCallback(async () => {
    if (!academicYear || !year || !division) {
      showToast('Select an academic year, program year, and division first.', 'warning');
      return;
    }
    setLoadingPreview(true);
    try {
      const { data } = await api.get('/api/coordinator/student-batches', {
        params: { academicYear, year, division },
      });
      setStudents((data.students || []).map((student) => ({
        ...student,
        draftBatch: student.labBatch || '',
        saving: false,
      })));
      setPreviewed(true);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to preview student batches', 'error');
    } finally {
      setLoadingPreview(false);
    }
  }, [academicYear, year, division, showToast]);

  const groups = useMemo(() => {
    const buckets = Object.fromEntries([...BATCHES_BY_DIVISION[division], 'Unassigned'].map((key) => [key, []]));
    students.forEach((student) => {
      const key = student.draftBatch || 'Unassigned';
      (buckets[key] || buckets.Unassigned).push(student);
    });
    return Object.entries(buckets);
  }, [students, division]);

  const dirtyCount = students.filter((student) => student.draftBatch !== (student.labBatch || '')).length;

  const updateDraft = (id, draftBatch) => {
    setStudents((current) => current.map((student) => (student.id === id ? { ...student, draftBatch } : student)));
  };

  const applySuggested = () => {
    setStudents((current) => current.map((student) => (
      student.suggestedBatch ? { ...student, draftBatch: student.suggestedBatch } : student
    )));
  };

  const saveStudent = async (student) => {
    setSavingId(student.id);
    try {
      await api.patch(`/api/coordinator/student-batches/${student.id}`, { labBatch: student.draftBatch || null });
      setStudents((current) => current.map((item) => (
        item.id === student.id ? { ...item, labBatch: student.draftBatch || null } : item
      )));
      showToast(`Batch saved for ${student.user?.name || student.studentId}.`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to save this student batch', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Lab Batch Allocation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Participants', href: '/dashboard/coordinator/participants' },
          { label: 'Lab Batch Allocation' },
        ]}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-blue-700" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Choose the student group</h2>
            <p className="mt-0.5 text-xs text-slate-500">Allocations are scoped to academic year, program year, and division.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-slate-600">
            Academic year
            <select value={academicYear} onChange={(event) => { setAcademicYear(event.target.value); setPreviewed(false); }} disabled={loadingOptions} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
              <option value="">Select academic year</option>
              {academicYears.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Program year
            <select value={year} onChange={(event) => { setYear(event.target.value); setPreviewed(false); }} disabled={loadingOptions} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
              <option value="">Select program year</option>
              {years.map((option) => <option key={option} value={option}>{yearLabel(option)}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Division
            <select value={division} onChange={(event) => { setDivision(event.target.value); setPreviewed(false); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800">
              {Object.keys(BATCHES_BY_DIVISION).map((option) => <option key={option} value={option}>Division {option}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={loadPreview} disabled={loadingPreview || loadingOptions || !academicYear || !year} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              <ArrowPathIcon className={`h-4 w-4 ${loadingPreview ? 'animate-spin' : ''}`} />
              {loadingPreview ? 'Loading…' : 'Preview allocation'}
            </button>
          </div>
        </div>
      </section>

      {previewed && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div>
              <p className="text-xs font-semibold text-blue-950">{students.length} students in {academicYear}, {yearLabel(year)}, Division {division}</p>
              <p className="mt-1 text-xs text-blue-800">Rolls 1–25 → {division}1, 26–50 → {division}2, 51–75 → {division}3. Rows with data issues receive no automatic suggestion.</p>
            </div>
            <button type="button" onClick={applySuggested} disabled={!students.some((student) => student.suggestedBatch)} className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50">Use valid suggestions</button>
          </section>

          {groups.map(([group, groupStudents]) => (
            <section key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{group === 'Unassigned' ? 'Unassigned / review' : `Batch ${group}`}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{groupStudents.length}</span>
              </div>
              {groupStudents.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Automatic suggestion</th><th className="px-4 py-3">Assigned batch</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupStudents.map((student) => {
                        const dirty = student.draftBatch !== (student.labBatch || '');
                        return (
                          <tr key={student.id}>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{student.rollNo ?? '—'}</td>
                            <td className="min-w-48 px-4 py-3"><p className="font-semibold text-slate-900">{student.user?.name || 'Unknown student'}</p><p className="mt-0.5 text-[10px] text-slate-500">{student.studentId}</p></td>
                            <td className="px-4 py-3 text-slate-700">{student.suggestedBatch || '—'}</td>
                            <td className="px-4 py-3">
                              <select value={student.draftBatch} onChange={(event) => updateDraft(student.id, event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800">
                                <option value="">Unassigned</option>
                                {BATCHES_BY_DIVISION[division].map((option) => <option key={option} value={option}>{option}</option>)}
                              </select>
                            </td>
                            <td className="max-w-64 px-4 py-3 text-amber-700">{student.allocationIssues?.length ? student.allocationIssues.map((issue) => ISSUE_LABELS[issue] || issue).join('; ') : <span className="text-emerald-700">Ready</span>}</td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => saveStudent(student)} disabled={!dirty || savingId === student.id} className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2.5 py-1.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                                <CheckIcon className="h-3.5 w-3.5" />{savingId === student.id ? 'Saving…' : 'Save'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="px-4 py-8 text-center text-xs text-slate-500">No students currently assigned to this batch.</p>}
            </section>
          ))}
          <p className="text-right text-[11px] text-slate-500">{dirtyCount} unsaved batch change{dirtyCount === 1 ? '' : 's'}</p>
        </>
      )}
    </div>
  );
};

export default StudentBatchAllocationPage;
