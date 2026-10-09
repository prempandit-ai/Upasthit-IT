import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import {
  getFacultyAttendanceAssignments,
  getEligibleAttendanceStudents,
  getAttendanceStudents,
  createAttendanceSession,
  startAttendanceSessionById,
  getActiveAttendanceSession,
  getAttendanceSession,
  getAttendanceSessionStudents,
  submitAttendance,
  completeAttendanceSession,
  getAttendanceHistory,
  getEventAttendancePending,
  getEventAttendanceApproved,
  getEventAttendanceRejected,
  approveEventAttendance,
  rejectEventAttendance,
  getAttendanceErrorMessage,
  getStoredAttendanceSessionId,
  storeAttendanceSessionId,
} from '../../../services/facultyService';

const IT_DEPARTMENT_LABEL = 'Information Technology (IT)';
const EMPTY_ROSTER_MESSAGE =
  'No students found for the selected class. Student enrollment data may not be available yet.';

const formatTimer = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatClockTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const remainingFromSession = (session) => {
  if (!session?.expiresAt || session.status !== 'ACTIVE') return 0;
  const serverMs = session.serverTime ? new Date(session.serverTime).getTime() : Date.now();
  const offset = Date.now() - serverMs;
  return Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - (Date.now() - offset)) / 1000));
};

const TakeAttendance = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState('');

  const [attendanceType, setAttendanceType] = useState('Class Lecture');
  const [department] = useState(IT_DEPARTMENT_LABEL);
  const [batch, setBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionType, setSessionType] = useState('Lecture');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00 AM - 10:00 AM');

  const [session, setSession] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [starting, setStarting] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [backendStats, setBackendStats] = useState({ total: 0, marked: 0, missing: 0, present: 0, absent: 0 });

  const [history, setHistory] = useState([]);
  const [historyFilterType, setHistoryFilterType] = useState('All');
  const [historyFilterSubject, setHistoryFilterSubject] = useState('All');
  const [historyFilterBatch, setHistoryFilterBatch] = useState('All');

  const [approvalTab, setApprovalTab] = useState('PENDING');
  const [approvals, setApprovals] = useState([]);

  const selectedAssignment = useMemo(() => {
    const normalizedSection = section.replace(/^Section\s+/i, '').replace(/^Div\s+/i, '').trim().toUpperCase();
    return (
      assignments.find(
        (item) =>
          item.batchLabel === batch &&
          item.subjectName === subject &&
          (item.sectionLabel === section ||
            item.division === normalizedSection ||
            (!item.division && (section === 'All Divisions' || section === 'All Sections' || !section)))
      ) ||
      assignments.find((item) => item.batchLabel === batch && item.subjectName === subject) ||
      null
    );
  }, [assignments, batch, subject, section]);

  const batchOptions = useMemo(() => {
    return Array.from(new Set(assignments.map((item) => item.batchLabel).filter(Boolean)));
  }, [assignments]);

  const subjectOptions = useMemo(() => {
    return Array.from(
      new Set(
        assignments
          .filter((item) => !batch || item.batchLabel === batch)
          .map((item) => item.subjectName)
          .filter(Boolean)
      )
    );
  }, [assignments, batch]);

  const sectionOptions = useMemo(() => {
    const matching = assignments.filter(
      (item) => (!batch || item.batchLabel === batch) && (!subject || item.subjectName === subject)
    );
    if (matching.length === 0) return [];
    const explicitDivisions = matching.map((item) => item.division).filter(Boolean);
    if (explicitDivisions.length > 0) {
      const list = explicitDivisions.map((d) => (String(d).startsWith('Div') ? d : `Div ${d}`));
      if (list.length > 1) list.push('All Divisions');
      return Array.from(new Set(list));
    }
    return ['Div A', 'Div B', 'All Divisions'];
  }, [assignments, batch, subject]);

  const sessionStatus = session?.status || 'NOT_STARTED';
  const sessionActive = sessionStatus === 'ACTIVE' && timeLeftSeconds > 0;
  const canMark = sessionActive;
  const canSubmit = sessionActive && students.length > 0;

  const sessionDetails = {
    course: session?.assignment?.subjectName || subject || '—',
    section: session?.assignment?.sectionLabel || section || '—',
    room: session?.room || '—',
    startTime: session?.startedAt ? formatClockTime(session.startedAt) : '—',
    endTime: session?.expiresAt ? formatClockTime(session.expiresAt) : '—',
  };

  const filteredStudents = useMemo(() => {
    if (!searchStudent.trim()) return students;
    const q = searchStudent.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || String(s.rollNo).toLowerCase().includes(q)
    );
  }, [students, searchStudent]);

  const localStats = useMemo(() => {
    const present = students.filter((s) => s.status === 'PRESENT').length;
    const absent = students.filter((s) => s.status === 'ABSENT').length;
    const late = students.filter((s) => s.status === 'LATE').length;
    const excused = students.filter((s) => s.status === 'EXCUSED').length;
    const marked = present + absent + late + excused;
    return {
      total: backendStats.total || students.length,
      present,
      absent,
      late,
      excused,
      marked: backendStats.marked ?? marked,
      missing: backendStats.missing ?? Math.max(0, (backendStats.total || students.length) - marked),
    };
  }, [students, backendStats]);

  const applySession = useCallback((nextSession) => {
    if (!nextSession) {
      setSession(null);
      setTimeLeftSeconds(0);
      storeAttendanceSessionId(null);
      return;
    }
    setSession(nextSession);
    setTimeLeftSeconds(remainingFromSession(nextSession));
    if (nextSession.stats) setBackendStats(nextSession.stats);
    if (nextSession.status === 'ACTIVE') storeAttendanceSessionId(nextSession.id);
    else storeAttendanceSessionId(null);
  }, []);

  const loadHistory = useCallback(async (filters = {}) => {
    try {
      const { data } = await getAttendanceHistory(filters);
      setHistory(data.sessions || []);
    } catch (error) {
      setHistory([]);
      showToast(getAttendanceErrorMessage(error, 'Unable to load attendance history'), 'error');
    }
  }, [showToast]);

  const loadRoster = useCallback(async (assignment, division) => {
    if (!assignment?.id) {
      setStudents([]);
      setBackendStats({ total: 0, marked: 0, missing: 0, present: 0, absent: 0 });
      return;
    }
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const { data } = await getAttendanceStudents({
        year: assignment.year,
        semester: assignment.semester,
        division: division || assignment.division || 'ALL',
        academicYear: assignment.academicYear,
        assignmentId: assignment.id,
      });
      const roster = (data.students || [])
        .map((student) => ({
          ...student,
          status: student.status || '',
        }))
        .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));
      setStudents(roster);
      setBackendStats({
        total: roster.length,
        marked: roster.filter((student) => student.status).length,
        missing: roster.filter((student) => !student.status).length,
        present: roster.filter((student) => student.status === 'PRESENT').length,
        absent: roster.filter((student) => student.status === 'ABSENT').length,
      });
      if (roster.length === 0) setStudentsError(EMPTY_ROSTER_MESSAGE);
    } catch (error) {
      setStudents([]);
      setStudentsError(getAttendanceErrorMessage(error, EMPTY_ROSTER_MESSAGE));
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const loadSessionStudents = useCallback(async (sessionId) => {
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const { data } = await getAttendanceSessionStudents(sessionId);
      const roster = (data.students || [])
        .map((student) => ({
          ...student,
          status: student.status || '',
        }))
        .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));
      setStudents(roster);
      if (data.session) applySession(data.session);
      if (roster.length === 0) setStudentsError(EMPTY_ROSTER_MESSAGE);
    } catch (error) {
      setStudents([]);
      setStudentsError(getAttendanceErrorMessage(error, 'Unable to load students for this session'));
    } finally {
      setStudentsLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setAssignmentsLoading(true);
      try {
        const { data } = await getFacultyAttendanceAssignments();
        if (cancelled) return;
        const nextAssignments = data.assignments || [];
        setAssignments(nextAssignments);
        setAssignmentsError(
          nextAssignments.length ? '' : 'No subjects are assigned to you yet. Assigned classes will appear here.'
        );
        if (nextAssignments[0]) {
          setBatch(nextAssignments[0].batchLabel);
          setSubject(nextAssignments[0].subjectName);
          const initialDiv = nextAssignments[0].division
            ? (String(nextAssignments[0].division).startsWith('Div') ? nextAssignments[0].division : `Div ${nextAssignments[0].division}`)
            : 'Div A';
          setSection(initialDiv);
          if (nextAssignments[0].subjectType === 'PRACTICAL') setSessionType('Lab Session');
        }
      } catch (error) {
        if (cancelled) return;
        setAssignments([]);
        setAssignmentsError(getAttendanceErrorMessage(error, 'Unable to load assigned subjects'));
        showToast(getAttendanceErrorMessage(error, 'Unable to load assigned subjects'), 'error');
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }

      try {
        const { data } = await getActiveAttendanceSession();
        if (cancelled) return;
        if (data.session) {
          applySession(data.session);
          await loadSessionStudents(data.session.id);
        } else {
          const storedId = getStoredAttendanceSessionId();
          if (storedId) {
            const stored = await getAttendanceSession(storedId);
            if (stored.data?.session) {
              applySession(stored.data.session);
              await loadSessionStudents(stored.data.session.id);
            } else {
              storeAttendanceSessionId(null);
            }
          }
        }
      } catch {
        storeAttendanceSessionId(null);
      }

      loadHistory();

      try {
        const [pending, approved, rejected] = await Promise.allSettled([
          getEventAttendancePending(),
          getEventAttendanceApproved(),
          getEventAttendanceRejected(),
        ]);
        const merged = [];
        if (pending.status === 'fulfilled') merged.push(...(pending.value.data?.events || pending.value.data || []));
        if (approved.status === 'fulfilled') merged.push(...(approved.value.data?.events || approved.value.data || []));
        if (rejected.status === 'fulfilled') merged.push(...(rejected.value.data?.events || rejected.value.data || []));
        if (!cancelled) setApprovals(Array.isArray(merged) ? merged.filter((item) => item?.id) : []);
      } catch {
        if (!cancelled) setApprovals([]);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applySession, loadHistory, loadSessionStudents, showToast]);

  useEffect(() => {
    if (!sessionActive || !selectedAssignment || session) return;
    loadRoster(selectedAssignment, section);
  }, [selectedAssignment, section, sessionActive, session, loadRoster]);

  useEffect(() => {
    if (session) return;
    if (selectedAssignment) loadRoster(selectedAssignment, section);
  }, [selectedAssignment, section, session, loadRoster]);

  useEffect(() => {
    if (!sessionActive) return undefined;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive]);

  useEffect(() => {
    if (!session?.id || sessionStatus !== 'ACTIVE' || timeLeftSeconds > 0) return undefined;
    let cancelled = false;
    const finalize = async () => {
      try {
        await completeAttendanceSession(session.id);
      } catch {
        // Backend expiry validation is the source of truth even if complete fails.
      }
      try {
        const { data } = await getAttendanceSession(session.id);
        if (!cancelled) {
          applySession(data.session);
          await loadSessionStudents(session.id);
          loadHistory();
        }
      } catch {
        if (!cancelled) applySession({ ...session, status: 'COMPLETED' });
      }
    };
    finalize();
    return () => {
      cancelled = true;
    };
  }, [timeLeftSeconds, session, sessionStatus, applySession, loadSessionStudents, loadHistory]);

  const handleBatchChange = (value) => {
    setBatch(value);
    const nextSubjects = assignments.filter((item) => item.batchLabel === value);
    const nextSubject = nextSubjects[0]?.subjectName || '';
    setSubject(nextSubject);
    const matching = assignments.filter(
      (item) => item.batchLabel === value && (!nextSubject || item.subjectName === nextSubject)
    );
    const explicitDivisions = matching.map((item) => item.division).filter(Boolean);
    const defaultSection = explicitDivisions.length > 0
      ? (String(explicitDivisions[0]).startsWith('Div') ? explicitDivisions[0] : `Div ${explicitDivisions[0]}`)
      : 'Div A';
    setSection(defaultSection);
  };

  const handleSubjectChange = (value) => {
    setSubject(value);
    const matching = assignments.filter(
      (item) => (!batch || item.batchLabel === batch) && item.subjectName === value
    );
    const explicitDivisions = matching.map((item) => item.division).filter(Boolean);
    const defaultSection = explicitDivisions.length > 0
      ? (String(explicitDivisions[0]).startsWith('Div') ? explicitDivisions[0] : `Div ${explicitDivisions[0]}`)
      : 'Div A';
    setSection(defaultSection);
  };

  const handleStartSession = async () => {
    if (!selectedAssignment) {
      showToast('Select a valid assigned subject, batch, and class before starting attendance.', 'error');
      return;
    }
    if (!date) {
      showToast('Please select a session date.', 'error');
      return;
    }
    if (sessionActive) {
      showToast('An attendance window is already active.', 'warning');
      return;
    }

    setStarting(true);
    try {
      const created = await createAttendanceSession({
        assignmentId: selectedAssignment.id,
        date,
        division: section || selectedAssignment.division || 'ALL',
        attendanceType,
        sessionType,
        lectureTime: time,
      });
      const sessionId = created.data?.session?.id;
      if (!sessionId) throw new Error('Session was not created');
      const started = await startAttendanceSessionById(sessionId);
      const nextSession = started.data?.session;
      if (!nextSession) throw new Error('Attendance window was not started');
      applySession(nextSession);
      await loadSessionStudents(nextSession.id);
      showToast('Attendance session started!', 'success');
    } catch (error) {
      if (error.response?.data?.session) {
        applySession(error.response.data.session);
        await loadSessionStudents(error.response.data.session.id);
      }
      showToast(getAttendanceErrorMessage(error, 'Unable to start the attendance window'), 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleMarkAll = (status) => {
    if (!canMark) {
      showToast('Start the attendance window before marking students.', 'warning');
      return;
    }
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    showToast(`Marked all students as ${status}`, 'info');
  };

  const handleStatusChange = (id, newStatus) => {
    if (!canMark) return;
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
  };

  const handleSubmitAttendance = async () => {
    if (!session?.id) {
      showToast('Start the attendance window before submitting.', 'error');
      return;
    }
    const records = students
      .filter((student) => student.status)
      .map((student) => ({ studentId: student.id, status: student.status }));
    if (records.length === 0) {
      showToast('Mark at least one student before submitting attendance.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await submitAttendance(session.id, { records });
      if (data.session) applySession(data.session);
      await loadSessionStudents(session.id);
      showToast('Attendance submitted successfully!', 'success');
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Attendance was not saved. Please try again.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHistoryFilter = () => {
    loadHistory({
      type: historyFilterType,
      subject: historyFilterSubject,
      batch: historyFilterBatch,
    });
  };

  const handleHistoryReset = () => {
    setHistoryFilterType('All');
    setHistoryFilterSubject('All');
    setHistoryFilterBatch('All');
    loadHistory();
  };

  const handleViewSession = async (row) => {
    try {
      applySession(null);
      const { data } = await getAttendanceSession(row.id);
      applySession(data.session);
      await loadSessionStudents(row.id);
      if (data.session?.assignment) {
        setBatch(data.session.assignment.batchLabel || '');
        setSubject(data.session.assignment.subjectName || '');
        setSection(data.session.assignment.sectionLabel || '');
      }
      showToast(`Loaded session details for ${row.subject || 'this class'}`, 'info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Unable to load session details'), 'error');
    }
  };

  const handleApproveEvent = async (id) => {
    try {
      await approveEventAttendance(id);
      showToast('Event attendance approved', 'success');
      setApprovals((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e)));
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Unable to approve event attendance'), 'error');
    }
  };

  const handleRejectEvent = async (id) => {
    try {
      await rejectEventAttendance(id);
      showToast('Event attendance rejected', 'warning');
      setApprovals((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED' } : e)));
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Unable to reject event attendance'), 'error');
    }
  };

  const windowTitle =
    sessionStatus === 'ACTIVE'
      ? 'Attendance Window Active'
      : sessionStatus === 'COMPLETED' || sessionStatus === 'EXPIRED'
      ? 'Attendance Window Completed'
      : 'Attendance Window Inactive';

  const timerBorderClass = sessionActive ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-slate-50';
  const statusDotClass = sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400';
  const statusTextClass = sessionActive ? 'text-emerald-700' : 'text-slate-600';

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb & Header */}
      <PageHeader
        title="Take Attendance"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Attendance', href: '/dashboard/faculty/attendance/history' },
          { label: 'Take Attendance' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/faculty/attendance/history')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ClockIcon className="h-4 w-4 text-slate-500" />
            Attendance History
          </button>
        }
      />

      {/* ── 1. Select Type & Details Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          1. Select Type &amp; Details to Take Attendance
        </h2>

        {/* Radio Attendance Type */}
        <div className="mb-5 flex flex-wrap items-center gap-6">
          <span className="text-xs font-medium text-slate-700">Attendance Type:</span>
          {['Class Lecture', 'Lab Session', 'Event'].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer text-xs text-slate-800">
              <input
                type="radio"
                name="attendanceType"
                checked={attendanceType === t}
                onChange={() => setAttendanceType(t)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span>{t}</span>
            </label>
          ))}
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
            <select
              value={department}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option>{IT_DEPARTMENT_LABEL}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Batch / Semester</label>
            <select
              value={batch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              {batchOptions.length === 0 ? (
                <option value="">No assigned batches yet</option>
              ) : (
                batchOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Subject / Course</label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              {subjectOptions.length === 0 ? (
                <option value="">No assigned subjects yet</option>
              ) : (
                subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option>Lecture</option>
              <option>Lab Session</option>
              <option>Tutorial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Class / Section</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              {sectionOptions.length === 0 ? (
                <option value="">No assigned sections yet</option>
              ) : (
                sectionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {assignmentsError ? (
          <p className="mt-3 text-xs text-amber-700">{assignmentsLoading ? 'Loading assigned classes...' : assignmentsError}</p>
        ) : null}

        {/* Note and Action Button */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500 italic">
            Note: Please verify the details before starting the attendance window. Only classes assigned to you can be conducted.
          </p>
          <button
            type="button"
            disabled={starting || sessionActive}
            onClick={handleStartSession}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {starting ? 'Starting...' : 'Start Attendance Window (5 Min)'}
          </button>
        </div>
      </section>

      {/* ── 2. Active Attendance Window Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          2. Active Attendance Window
        </h2>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Countdown circular timer */}
          <div className="flex items-center gap-5">
            <div className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 ${timerBorderClass}`}>
              <div className="text-center">
                <span className="block text-xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {sessionActive ? formatTimer(timeLeftSeconds) : '00:00'}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 uppercase">
                  Time Left
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                <span className={`text-sm font-bold ${statusTextClass}`}>
                  {windowTitle}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Started at: <span className="font-medium text-slate-900">{sessionDetails.startTime}</span> | Ends at: <span className="font-medium text-slate-900">{sessionDetails.endTime}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Course: <span className="font-medium text-slate-900">{sessionDetails.course}</span> | Section: <span className="font-medium text-slate-900">{sessionDetails.section}</span> | Room: <span className="font-medium text-slate-900">{sessionDetails.room}</span>
              </p>
            </div>
          </div>

          {/* Stat Counters on the right */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-slate-500">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{localStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-emerald-700">Marked</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{localStats.marked}</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center min-w-[90px]">
              <p className="text-[11px] font-medium text-rose-700">Missing</p>
              <p className="text-2xl font-bold text-rose-700 mt-0.5">{localStats.missing}</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">i</span>
          <span>Students can report missing attendance within this 5-minute window via their mobile portal.</span>
        </div>
      </section>

      {/* ── 3. Students List Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">3. Students List</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              disabled={!canMark}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              disabled={!canMark}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or roll no..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/40 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    {studentsError || EMPTY_ROSTER_MESSAGE}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{st.rollNo || '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{st.name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={st.status || ''}
                        disabled={!canMark}
                        onChange={(e) => handleStatusChange(st.id, e.target.value)}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${
                          st.status === 'PRESENT'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : st.status === 'ABSENT'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : st.status === 'LATE'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                        }`}
                      >
                        <option value="">Mark</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Flag or add note"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <FlagIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <span>Present: <strong className="text-emerald-600">{localStats.present}</strong></span>
            <span>Absent: <strong className="text-rose-600">{localStats.absent}</strong></span>
            <span>Late: <strong className="text-amber-600">{localStats.late}</strong></span>
            <span>Missing: <strong className="text-slate-700">{localStats.missing}</strong></span>
          </div>

          <button
            type="button"
            disabled={submitting || !canSubmit}
            onClick={handleSubmitAttendance}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </div>
      </section>

      {/* ── 4. Attendance History Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">4. Attendance History</h2>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Type</label>
            <select
              value={historyFilterType}
              onChange={(e) => setHistoryFilterType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              <option>Lecture</option>
              <option>Lab</option>
              <option>Event</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Subject / Course</label>
            <select
              value={historyFilterSubject}
              onChange={(e) => setHistoryFilterSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              {Array.from(new Set(assignments.map((item) => item.subjectName))).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch / Semester</label>
            <select
              value={historyFilterBatch}
              onChange={(e) => setHistoryFilterBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              {batchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleHistoryFilter}
              className="flex-1 rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleHistoryReset}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Subject / Event</th>
                <th className="px-4 py-3">Batch / Section</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                    No attendance sessions found yet.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{formatDisplayDate(row.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.type} /></td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.subject}</td>
                    <td className="px-4 py-3 text-slate-600">{row.batch}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.time || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.total}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{row.present}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{row.absent}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title={`View Details (${row.status || 'SESSION'})`}
                        onClick={() => handleViewSession(row)}
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
      </section>

      {/* ── 5. Event Attendance Approval Card ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">5. Event Attendance Approval</h2>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => {
            const count = approvals.filter((a) => a.status === tab).length;
            const active = approvalTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setApprovalTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Approval Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Event Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Total Participants</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.filter((a) => a.status === approvalTab).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No event attendance requests in this tab.
                  </td>
                </tr>
              ) : (
                approvals
                  .filter((a) => a.status === approvalTab)
                  .map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{ev.name}</td>
                      <td className="px-4 py-3 text-slate-600">{ev.date}</td>
                      <td className="px-4 py-3 text-slate-600">{ev.requestedBy}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{ev.participants}</td>
                      <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {ev.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveEvent(ev.id)}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectEvent(ev.id)}
                              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default TakeAttendance;
