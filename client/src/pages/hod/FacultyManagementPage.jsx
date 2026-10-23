import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { useToast } from '../../context/ToastContext';
import useAuth from '../../hooks/useAuth';
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  BookOpenIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  assignSubjectToFaculty,
  getFacultyManagementList,
  getFacultySubjectAssignments,
  getSubjectCatalog,
} from '../../services/facultyService';

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const FacultyManagementPage = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const dashboardPath = isAdmin ? '/dashboard/admin' : '/dashboard/hod';
  const pagePath = isAdmin ? '/dashboard/admin/faculty-subjects' : '/dashboard/hod/faculty';
  const [facultyList, setFacultyList] = useState([]);
  const [directoryView, setDirectoryView] = useState('CURRENT');
  const currentFaculty = facultyList.filter((item) => item.classification === 'CURRENT');
  const directoryFaculty = facultyList.filter((item) => item.classification === directoryView);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshAssignments, setRefreshAssignments] = useState(0);
  const [pageError, setPageError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [facultyResponse, subjectResponse] = await Promise.all([
        getFacultyManagementList({ limit: 100, classification: 'all' }),
        getSubjectCatalog({ limit: 100 }),
      ]);
      const nextFaculty = facultyResponse.data?.faculty ?? [];
      const assignable = nextFaculty.filter((item) => item.classification === 'CURRENT');
      const nextSubjects = subjectResponse.data?.subjects ?? [];

      setFacultyList(nextFaculty);
      setSubjects(nextSubjects);
      setSelectedFacultyId((current) =>
        assignable.some((faculty) => String(faculty.id) === current)
          ? current
          : String(assignable[0]?.id ?? '')
      );
      setSelectedAcademicYear((current) =>
        nextSubjects.some((subject) => subject.academicYear === current)
          ? current
          : nextSubjects[0]?.academicYear ?? ''
      );
      setSelectedSubjectId((current) =>
        nextSubjects.some((subject) => String(subject.id) === current)
          ? current
          : String(nextSubjects[0]?.id ?? '')
      );
      setRefreshAssignments((current) => current + 1);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to load faculty and subjects.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (!selectedFacultyId) {
      setAssignments([]);
      setAssignmentsLoading(false);
      return undefined;
    }

    let active = true;
    setAssignmentsLoading(true);
    setAssignmentError('');
    getFacultySubjectAssignments(selectedFacultyId)
      .then(({ data }) => {
        if (active) setAssignments(data?.assignments ?? []);
      })
      .catch((error) => {
        if (active) {
          setAssignments([]);
          setAssignmentError(getErrorMessage(error, 'Unable to load this faculty member’s assignments.'));
        }
      })
      .finally(() => {
        if (active) setAssignmentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedFacultyId, refreshAssignments]);

  const academicYears = useMemo(
    () => [...new Set(subjects.map((subject) => subject.academicYear).filter(Boolean))].sort(),
    [subjects]
  );
  const subjectsForYear = useMemo(
    () => subjects.filter((subject) => subject.academicYear === selectedAcademicYear),
    [subjects, selectedAcademicYear]
  );
  const selectedFaculty = facultyList.find(
    (faculty) => String(faculty.id) === selectedFacultyId
  );

  useEffect(() => {
    if (!subjectsForYear.some((subject) => String(subject.id) === selectedSubjectId)) {
      setSelectedSubjectId(String(subjectsForYear[0]?.id ?? ''));
    }
  }, [subjectsForYear, selectedSubjectId]);

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!selectedFacultyId || !selectedSubjectId || !selectedAcademicYear) {
      showToast('Select a faculty member, academic year, and subject.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const { data } = await assignSubjectToFaculty(selectedFacultyId, {
        subjectId: Number(selectedSubjectId),
        academicYear: selectedAcademicYear,
        division: selectedDivision || null,
      });
      showToast(data.message, 'success');
      setRefreshAssignments((current) => current + 1);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to assign this subject.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Faculty & Subject Assignments"
        breadcrumbs={[
          { label: 'Dashboard', href: dashboardPath },
          { label: 'Faculty Management', href: pagePath },
          { label: 'Subject Assignments' },
        ]}
        actions={
          <button
            type="button"
            onClick={loadDirectory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh data
          </button>
        }
      />

      <p className="text-sm text-slate-600">
        Review faculty and subjects from the academic database, then assign a subject for its recorded academic year and division.
      </p>

      {pageError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading faculty and subject records…
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-12">
            <form
              onSubmit={handleAssign}
              className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ArrowsRightLeftIcon className="h-5 w-5 text-blue-700" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Assign a subject</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Existing faculty and subject records only</p>
                </div>
              </div>

              <div>
                <label htmlFor="faculty-select" className="mb-1 block text-xs font-semibold text-slate-700">
                  Faculty member
                </label>
                <select
                  id="faculty-select"
                  value={selectedFacultyId}
                  onChange={(event) => setSelectedFacultyId(event.target.value)}
                  disabled={!currentFaculty.length}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  {!currentFaculty.length && <option value="">No faculty records found</option>}
                  {currentFaculty.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.employeeId} · {faculty.user?.name ?? 'Unnamed faculty'} · {faculty.user?.email ?? ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="academic-year-select" className="mb-1 block text-xs font-semibold text-slate-700">
                  Academic year
                </label>
                <select
                  id="academic-year-select"
                  value={selectedAcademicYear}
                  onChange={(event) => setSelectedAcademicYear(event.target.value)}
                  disabled={!academicYears.length}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  {!academicYears.length && <option value="">No academic years found</option>}
                  {academicYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="subject-select" className="mb-1 block text-xs font-semibold text-slate-700">
                  Subject
                </label>
                <select
                  id="subject-select"
                  value={selectedSubjectId}
                  onChange={(event) => setSelectedSubjectId(event.target.value)}
                  disabled={!subjectsForYear.length}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  {!subjectsForYear.length && <option value="">No subjects for this academic year</option>}
                  {subjectsForYear.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectCode} · {subject.subjectName} · Sem {subject.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="division-select" className="mb-1 block text-xs font-semibold text-slate-700">
                  Division
                </label>
                <select
                  id="division-select"
                  value={selectedDivision}
                  onChange={(event) => setSelectedDivision(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">All divisions</option>
                  <option value="A">Division A</option>
                  <option value="B">Division B</option>
                  <option value="C">Division C</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving || !facultyList.length || !subjectsForYear.length}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
                {saving ? 'Saving assignment…' : 'Save assignment'}
              </button>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Current assignments</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedFaculty
                      ? `${selectedFaculty.employeeId} · ${selectedFaculty.user?.name ?? 'Faculty member'}`
                      : 'Select a faculty member'}
                  </p>
                </div>
                {selectedFaculty && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {assignments.length} {assignments.length === 1 ? 'subject' : 'subjects'}
                  </span>
                )}
              </div>

              {assignmentError ? (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{assignmentError}</p>
              ) : assignmentsLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading assignments…</p>
              ) : assignments.length ? (
                <div className="divide-y divide-slate-100">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                          <BookOpenIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {assignment.subject?.subjectCode} · {assignment.subject?.subjectName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {assignment.subject?.year} · Semester {assignment.subject?.semester} · {assignment.academicYear}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {assignment.division ? `Division ${assignment.division}` : 'Division not confirmed'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-500">
                  No subjects are assigned to this faculty member yet.
                </p>
              )}
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <UserGroupIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Faculty directory</h2>
                  <div className="mt-2 flex gap-2" aria-label="Faculty directory views">
                    {['CURRENT', 'HISTORICAL'].map((view) => (
                      <button key={view} type="button" aria-pressed={directoryView === view}
                        onClick={() => setDirectoryView(view)}
                        className={directoryView === view ? 'rounded bg-blue-100 px-2 py-1 text-blue-800' : 'rounded bg-slate-100 px-2 py-1 text-slate-600'}>
                        {view === 'CURRENT' ? 'Current Faculty' : 'Historical / Archived Faculty'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">{directoryFaculty.length} records from the database</p>
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">Faculty</th>
                      <th className="px-5 py-2.5 font-semibold">Department</th>
                      <th className="px-5 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {directoryFaculty.map((faculty) => (
                      <tr key={faculty.id} className="text-slate-700">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{faculty.user?.name}</p>
                          <p className="mt-0.5 text-slate-500">{faculty.employeeId} · {faculty.user?.email}</p>
                        </td>
                        <td className="px-5 py-3">{faculty.department?.code ?? faculty.departmentCode}</td>
                        <td className="px-5 py-3">{faculty.user?.status ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <BookOpenIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Subject catalog</h2>
                  <p className="text-xs text-slate-500">{subjects.length} records from the database</p>
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">Subject</th>
                      <th className="px-5 py-2.5 font-semibold">Course</th>
                      <th className="px-5 py-2.5 font-semibold">Academic year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="text-slate-700">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{subject.subjectCode}</p>
                          <p className="mt-0.5 text-slate-500">{subject.subjectName}</p>
                        </td>
                        <td className="px-5 py-3">{subject.year} · Sem {subject.semester}</td>
                        <td className="px-5 py-3">{subject.academicYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyManagementPage;
