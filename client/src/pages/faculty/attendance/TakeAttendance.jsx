import { attendanceCounts, attendanceRecords, markLoadedRoster, rosterShortcut } from '../../../utils/attendanceMarking';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { mergePolledAttendanceRoster } from '../../../utils/attendanceRoster';
import {
  getFacultyAttendanceAssignments,
  getEligibleAttendanceStudents,
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
const emptyLabRosterMessage = (batch, division) => {
  const normalizedDivision = String(division || '')
    .replace(/^(section|division|div)\s*/i, '')
    .trim()
    .toUpperCase();
  return `No students are allocated to ${batch} in Division ${normalizedDivision}. Ask the coordinator to assign student lab batches before starting attendance.`;
};
const formatDivisionOption = (value) => {
  const division = String(value || '').replace(/^(section|division|div)\s*/i, '').trim().toUpperCase();
  return division === 'ALL' ? 'All Divisions' : division ? `Div ${division}` : '';
};

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
  const [labBatch, setLabBatch] = useState('');
  const [subject, setSubject] = useState('');
  const [sessionType, setSessionType] = useState('Lecture');
  const [section, setSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');

  const [session, setSession] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [starting, setStarting] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const rosterRequestId = useRef(0);
  const sessionRosterRequestId = useRef(0);
  const sessionRosterInFlight = useRef(new Map());
  const dirtyStudentStatuses = useRef(new Map());
  const loadedSessionId = useRef(null);
  const timeLeftRef = useRef(0);
  const [searchStudent, setSearchStudent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const lastSubmission = useRef('');
  const [focusedStudentId, setFocusedStudentId] = useState(null);
  const rowRefs = useRef(new Map());

  const [history, setHistory] = useState([]);
  const [historyFilterType, setHistoryFilterType] = useState('All');
  const [historyFilterSubject, setHistoryFilterSubject] = useState('All');
  const [historyFilterBatch, setHistoryFilterBatch] = useState('All');

  const [approvalTab, setApprovalTab] = useState('PENDING');
  const [approvals, setApprovals] = useState([]);

  const selectedAssignment = useMemo(() => {
    const normalizedSection = section.replace(/^(section|division|div)\s*/i, '').trim().toUpperCase();
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

  const isLabSession = attendanceType === 'Lab Session';

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
      return Array.from(new Set(explicitDivisions
        .map((d) => String(d).replace(/^(section|division|div)\s*/i, '').trim().toUpperCase())
        .filter((d) => ['A', 'B'].includes(d))
        .map((d) => `Div ${d}`)));
    }
    return ['Div A', 'Div B'];
  }, [assignments, batch, subject]);

  const sessionStatus = session?.status || 'NOT_STARTED';
  const sessionActive = sessionStatus === 'ACTIVE' && timeLeftSeconds > 0;
  const selectionLocked = sessionStatus === 'ACTIVE' || starting || submitting;
  const canMark = sessionActive && !studentsLoading && !submitting;
  const canSubmit = canMark && students.some((student) => student.eligible !== false);
  const cannotStartEmptyLab = isLabSession && (!labBatch || studentsLoading || !students.some((student) => student.eligible !== false));

  const sessionDetails = {
    course: session?.assignment?.subjectName || subject || '—',
    section: formatDivisionOption(session?.division || section) || '—',
    labBatch: session?.labBatch || '',
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

  const localStats = useMemo(() => attendanceCounts(students), [students]);

  // Scoped to the roster so shortcuts never intercept other page controls.
  const handleRosterKeyDown = (event) => {
    if (!canMark || event.ctrlKey || event.metaKey || event.altKey ||
        event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (!['arrowup', 'arrowdown', 'p', 'a'].includes(key) || !filteredStudents.length) return;
    event.preventDefault();
    const action = rosterShortcut(filteredStudents, focusedStudentId, key);
    if (!action) return;
    setFocusedStudentId(action.id);
    rowRefs.current.get(action.id)?.focus();
    if (action.status) {
      dirtyStudentStatuses.current.set(action.id, action.status);
      setStudents((previous) => previous.map((item) => item.id === action.id
        ? { ...item, status: action.status } : item));
    }
  };

  const applySession = useCallback((nextSession) => {
    if (!nextSession) {
      setSession(null);
      setTimeLeftSeconds(0);
      timeLeftRef.current = 0;
      storeAttendanceSessionId(null);
      return;
    }
    setSession(nextSession);
    const remaining = remainingFromSession(nextSession);
    setTimeLeftSeconds(remaining);
    timeLeftRef.current = remaining;
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

  const loadRoster = useCallback(async (assignment, division, selectedLabBatch, type) => {
    const requestId = ++rosterRequestId.current;
    sessionRosterRequestId.current += 1;
    sessionRosterInFlight.current.clear();
    dirtyStudentStatuses.current.clear();
    loadedSessionId.current = null;
    if (!assignment?.id) {
      setStudents([]);
      setStudentsLoading(false);
      setStudentsError('');

      return;
    }
    if (type === 'Lab Session' && !selectedLabBatch) {
      setStudents([]);
      setStudentsLoading(false);
      setStudentsError('Select a lab batch to load its assigned students.');

      return;
    }
    setStudents([]);
    setStudentsLoading(true);
    setStudentsError('');
    try {
      const { data } = await getEligibleAttendanceStudents({
        assignmentId: assignment.id,
        division: division || assignment.division || 'ALL',
        sessionType: type,
        attendanceType: type === 'Lab Session' ? 'Lab Session' : 'Class Lecture',
        ...(type === 'Lab Session' ? { labBatch: selectedLabBatch } : {}),
      });
      const roster = (data.students || [])
        .map((student) => ({
          ...student,
          status: student.status || '',
          eligible: student.eligible !== false,
        }))
        .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));
      if (requestId !== rosterRequestId.current) return;
      setStudents(roster);

      if (roster.length === 0) {
        setStudentsError(
          type === 'Lab Session'
            ? emptyLabRosterMessage(selectedLabBatch, division)
            : EMPTY_ROSTER_MESSAGE
        );
      }
    } catch (error) {
      if (requestId !== rosterRequestId.current) return;
      setStudents([]);
      setStudentsError(
        getAttendanceErrorMessage(
          error,
          type === 'Lab Session'
            ? emptyLabRosterMessage(selectedLabBatch, division)
            : EMPTY_ROSTER_MESSAGE
        )
      );
    } finally {
      if (requestId === rosterRequestId.current) setStudentsLoading(false);
    }
  }, []);

  const loadSessionStudents = useCallback(async (sessionId, { silent = false, preserveVisibleRoster = false } = {}) => {
    if (silent && sessionRosterInFlight.current.has(sessionId)) return;

    const isNewSessionRoster = loadedSessionId.current !== sessionId;
    if (isNewSessionRoster) {
      dirtyStudentStatuses.current.clear();
      loadedSessionId.current = sessionId;
      if (!silent && !preserveVisibleRoster) setStudents([]);
    }

    const requestId = ++sessionRosterRequestId.current;
    rosterRequestId.current += 1;
    sessionRosterInFlight.current.set(sessionId, requestId);
    if (!silent && !preserveVisibleRoster) {
      setStudentsLoading(true);
      setStudentsError('');
    }
    try {
      const { data } = await getAttendanceSessionStudents(sessionId);
      const roster = (data.students || [])
        .map((student) => ({
          ...student,
          status: student.status || '',
          eligible: student.eligible !== false,
        }))
        .sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0));
      if (requestId !== sessionRosterRequestId.current) return;
      if (silent || preserveVisibleRoster || !isNewSessionRoster) {
        setStudents((current) => requestId === sessionRosterRequestId.current
          ? mergePolledAttendanceRoster(current, roster, dirtyStudentStatuses.current)
          : current);
      } else {
        setStudents(roster);
      }
      if (data.session) {
        if (!silent || data.session.status !== 'ACTIVE') {
          applySession(data.session);
        }
        if (!silent && data.session.assignment) {
          setBatch(data.session.assignment.batchLabel || '');
          setSubject(data.session.assignment.subjectName || '');
          const currentDivision = data.session.division || data.session.assignment?.division || 'A';
          setSection(formatDivisionOption(currentDivision));
          setLabBatch(data.session.labBatch || '');
          const currentType = data.session.attendanceType || (data.session.labBatch ? 'Lab Session' : 'Class Lecture');
          setAttendanceType(/lab/i.test(currentType) ? 'Lab Session' : currentType === 'Event' ? 'Event' : 'Class Lecture');
          setSessionType(data.session.sessionType || (/lab/i.test(currentType) ? 'Lab Session' : 'Lecture'));
        }
      }
      if (!silent && roster.length === 0) setStudentsError(EMPTY_ROSTER_MESSAGE);
    } catch (error) {
      if (requestId !== sessionRosterRequestId.current) return;
      if (!silent) {
        if (isNewSessionRoster && !preserveVisibleRoster) setStudents([]);
        setStudentsError(getAttendanceErrorMessage(error, 'Unable to load students for this session'));
      }
    } finally {
      if (sessionRosterInFlight.current.get(sessionId) === requestId) {
        sessionRosterInFlight.current.delete(sessionId);
      }
      if (!silent && !preserveVisibleRoster && requestId === sessionRosterRequestId.current) setStudentsLoading(false);
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
          const initialDiv = formatDivisionOption(nextAssignments[0].division) || 'Div A';
          setSection(initialDiv);
          if (nextAssignments[0].subjectType === 'PRACTICAL') {
            setAttendanceType('Lab Session');
            setSessionType('Lab Session');
          }
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
    if (session) return;
    if (selectedAssignment) loadRoster(selectedAssignment, section, labBatch, sessionType);
  }, [selectedAssignment, section, labBatch, sessionType, session, loadRoster]);

  useEffect(() => {
    if (!sessionActive) return undefined;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionActive]);

  useEffect(() => {
    if (!session?.id || sessionStatus !== 'ACTIVE' || timeLeftRef.current <= 0) return undefined;
    let refreshRoster;
    const pollRoster = () => {
      if (timeLeftRef.current <= 0) {
        clearInterval(refreshRoster);
        return;
      }
      loadSessionStudents(session.id, { silent: true });
    };
    refreshRoster = setInterval(pollRoster, 5000);
    return () => clearInterval(refreshRoster);
  }, [session?.id, session?.expiresAt, sessionStatus, loadSessionStudents]);

  useEffect(() => {
    if (!session?.id || sessionStatus !== 'ACTIVE' || timeLeftSeconds > 0) return undefined;
    let cancelled = false;
    const finalize = async () => {
      try {
        await completeAttendanceSession(session.id);
      } catch {
        // Expiry validation on the server remains authoritative if completion races.
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
    clearSelectionSession();
    setBatch(value);
    setLabBatch('');
    const nextSubjects = assignments.filter((item) => item.batchLabel === value);
    const nextSubject = nextSubjects[0]?.subjectName || '';
    setSubject(nextSubject);
    const matching = assignments.filter(
      (item) => item.batchLabel === value && (!nextSubject || item.subjectName === nextSubject)
    );
    const explicitDivisions = matching.map((item) => item.division).filter(Boolean);
    const defaultSection = explicitDivisions.length > 0 ? formatDivisionOption(explicitDivisions[0]) : 'Div A';
    setSection(defaultSection);
  };

  const handleSubjectChange = (value) => {
    clearSelectionSession();
    setSubject(value);
    setLabBatch('');
    const matching = assignments.filter(
      (item) => (!batch || item.batchLabel === batch) && item.subjectName === value
    );
    const explicitDivisions = matching.map((item) => item.division).filter(Boolean);
    const defaultSection = explicitDivisions.length > 0 ? formatDivisionOption(explicitDivisions[0]) : 'Div A';
    setSection(defaultSection);
  };

  const clearSelectionSession = () => {
    if (selectionLocked) return;
    rosterRequestId.current += 1;
    sessionRosterRequestId.current += 1;
    sessionRosterInFlight.current.clear();
    dirtyStudentStatuses.current.clear();
    loadedSessionId.current = null;
    applySession(null);
    setStudents([]);
    setStudentsLoading(false);
    setStudentsError('');
  };

  const handleAttendanceTypeChange = (value) => {
    clearSelectionSession();
    setAttendanceType(value);
    setSessionType(value === 'Class Lecture' ? 'Lecture' : value);
    if (value !== 'Lab Session') setLabBatch('');
  };

  const handleDivisionChange = (value) => {
    clearSelectionSession();
    setSection(value);
    setLabBatch('');
  };

  const handleLabBatchChange = (value) => {
    clearSelectionSession();
    setLabBatch(value);
  };

  const handleStartSession = async () => {
    if (!selectedAssignment) {
      showToast('Select a valid assigned subject, batch, and class before starting attendance.', 'error');
      return;
    }
    if (!['A', 'B'].includes(section.replace(/^(section|division|div)\s*/i, '').trim().toUpperCase())) {
      showToast('Select Division A or Division B before starting attendance.', 'error');
      return;
    }
    if (isLabSession && !['A1', 'A2', 'A3', 'B1', 'B2', 'B3'].includes(labBatch)) {
      showToast('Select a lab batch before starting lab attendance.', 'error');
      return;
    }
    if (isLabSession && studentsLoading) {
      showToast('Wait for the selected lab batch roster to finish loading.', 'warning');
      return;
    }
    if (isLabSession && students.length === 0) {
      showToast(emptyLabRosterMessage(labBatch, section), 'error');
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
        labBatch: isLabSession ? labBatch : null,
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
      await loadSessionStudents(nextSession.id, { preserveVisibleRoster: true });
      showToast('Attendance session started!', 'success');
    } catch (error) {
      if (error.response?.data?.session) {
        applySession(error.response.data.session);
        await loadSessionStudents(error.response.data.session.id, { preserveVisibleRoster: true });
      }
      showToast(getAttendanceErrorMessage(error, 'Unable to start the attendance window'), 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleIssueStudentCode = async () => {
    if (!session?.id || !sessionActive) return;
    setStarting(true);
    try {
      const { data } = await startAttendanceSessionById(session.id);
      if (!data?.session) throw new Error('The active attendance session was not returned');
      setSession((current) => current?.id === session.id
        ? { ...current, joinCode: data.session.joinCode || current.joinCode }
        : current);
      showToast('Student check-in code issued for this active window.', 'success');
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Unable to issue a student check-in code'), 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleMarkAll = (status) => {
    if (!canMark) {
      showToast('Start the attendance window before marking students.', 'warning');
      return;
    }
    students.forEach((student) => {
      if (student.eligible !== false) dirtyStudentStatuses.current.set(student.id, status);
    });
    setStudents((prev) => markLoadedRoster(prev, status));
    showToast(`Marked all students as ${status}`, 'info');
  };

  const handleStatusChange = (id, newStatus) => {
    if (!canMark || !['PRESENT', 'ABSENT', ''].includes(newStatus)) return;
    dirtyStudentStatuses.current.set(id, newStatus);
    setStudents((prev) => prev.map((s) =>
      s.id === id && s.eligible !== false ? { ...s, status: newStatus } : s
    ));
  };

  const handleSubmitAttendance = async () => {
    if (submissionLock.current) return;
    if (!session?.id || !canSubmit) {
      showToast('Start the attendance window before submitting.', 'error');
      return;
    }
    let records;
    try { records = attendanceRecords(students); }
    catch (error) { showToast(error.message, 'error'); return; }
    if (records.length === 0) {
      showToast('Mark at least one student before submitting attendance.', 'warning');
      return;
    }

    const signature = JSON.stringify([session.id, records]);
    if (signature === lastSubmission.current) {
      showToast('These attendance marks have already been submitted.', 'info');
      return;
    }
    if (!window.confirm(`Submit attendance for ${localStats.total} students? Present: ${localStats.present}, Absent: ${localStats.absent}, Unmarked: ${localStats.missing}. Unmarked students will not be saved.`)) return;
    submissionLock.current = true;
    setSubmitting(true);
    try {
      const { data } = await submitAttendance(session.id, { records });
      lastSubmission.current = signature;
      if (data.session) applySession(data.session);
      dirtyStudentStatuses.current.clear();
      sessionRosterRequestId.current += 1;
      await loadSessionStudents(session.id, { silent: true });
      showToast('Attendance submitted successfully!', 'success');
    } catch (error) {
      showToast(getAttendanceErrorMessage(error, 'Attendance was not saved. Please try again.'), 'error');
    } finally {
      submissionLock.current = false;
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
      rosterRequestId.current += 1;
      sessionRosterRequestId.current += 1;
      sessionRosterInFlight.current.clear();
      dirtyStudentStatuses.current.clear();
      loadedSessionId.current = null;
      applySession(null);
      const { data } = await getAttendanceSession(row.id);
      applySession(data.session);
      await loadSessionStudents(row.id);
      if (data.session?.assignment) {
        setBatch(data.session.assignment.batchLabel || '');
        setSubject(data.session.assignment.subjectName || '');
        const currentDivision = data.session.division || data.session.assignment.division || 'A';
        setSection(formatDivisionOption(currentDivision));
        setLabBatch(data.session.labBatch || '');
        setAttendanceType(/lab/i.test(data.session.attendanceType || data.session.sessionType || '') ? 'Lab Session' : 'Class Lecture');
        setSessionType(data.session.sessionType || 'Lecture');
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
                onChange={() => handleAttendanceTypeChange(t)}
                disabled={selectionLocked}
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Academic Year / Semester</label>
            <select
              value={batch}
              onChange={(e) => handleBatchChange(e.target.value)}
              disabled={selectionLocked}
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
              disabled={selectionLocked}
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Class / Section</label>
            <select
              value={section}
              onChange={(e) => handleDivisionChange(e.target.value)}
              disabled={selectionLocked}
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

          {isLabSession && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lab Batch</label>
              <select
                value={labBatch}
                onChange={(e) => handleLabBatchChange(e.target.value)}
                disabled={selectionLocked}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="">Select lab batch</option>
                {(section.replace(/^(section|division|div)\s*/i, '').trim().toUpperCase() === 'A'
                  ? ['A1', 'A2', 'A3']
                  : section.replace(/^(section|division|div)\s*/i, '').trim().toUpperCase() === 'B'
                    ? ['B1', 'B2', 'B3']
                    : []
                ).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={selectionLocked}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
            <input
              type="text"
              value={time}
              placeholder="Optional session time"
              onChange={(e) => setTime(e.target.value)}
              disabled={selectionLocked}
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
            disabled={starting || selectionLocked || cannotStartEmptyLab}
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
                Course: <span className="font-medium text-slate-900">{sessionDetails.course}</span> | Section: <span className="font-medium text-slate-900">{sessionDetails.section}</span>{sessionDetails.labBatch ? <> | Lab Batch: <span className="font-medium text-slate-900">{sessionDetails.labBatch}</span></> : null} | Room: <span className="font-medium text-slate-900">{sessionDetails.room}</span>
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
          <span>
            {sessionActive && session?.joinCode
              ? 'Students can check in with the six-digit code during this five-minute window.'
              : sessionActive
              ? 'This active window has no check-in code and cannot accept student mobile check-ins.'
              : 'Start the five-minute window to issue a student mobile check-in code.'}
          </span>
        </div>
        {sessionActive && session?.joinCode ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Student check-in code</span>
            <span className="font-mono text-2xl font-extrabold tracking-[0.3em] text-emerald-900">{session.joinCode}</span>
            <span className="text-xs text-emerald-800">Share with this class during the active window only.</span>
          </div>
        ) : null}
        {sessionActive && !session?.joinCode ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-xs text-amber-800">This active window has no student check-in code.</span>
            <button
              type="button"
              disabled={starting}
              onClick={handleIssueStudentCode}
              className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {starting ? 'Issuing...' : 'Issue code for this window'}
            </button>
          </div>
        ) : null}
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

        <p className="mb-3 text-xs text-slate-500" aria-live="polite">
          P = Present | A = Absent | Arrow Up/Down = move between rows. Bulk actions affect the loaded eligible roster ({localStats.total}), including search-hidden rows. Historical rows are read-only.
        </p>
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
              {studentsLoading && filteredStudents.length === 0 ? (
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
                  <tr key={st.id} tabIndex={0} onKeyDown={handleRosterKeyDown}
                    ref={(node) => { if (node) rowRefs.current.set(st.id, node); else rowRefs.current.delete(st.id); }}
                    onFocus={() => setFocusedStudentId(st.id)}
                    className="hover:bg-slate-50/80 focus:bg-blue-50 focus:outline-2 focus:outline-blue-500 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{st.rollNo || '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {st.name}
                      {st.eligible === false ? (
                        <span className="ml-2 text-[10px] font-medium text-amber-700">
                          Historical record · not in current roster
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1" role="group" aria-label={`Attendance for ${st.name}`}>
                        {[['PRESENT', 'P', 'Present'], ['ABSENT', 'A', 'Absent'], ['', '--', 'Unmarked']].map(([value, label, title]) => (
                          <button key={title} type="button" disabled={!canMark || st.eligible === false}
                            aria-label={title} aria-pressed={st.status === value}
                            onClick={() => handleStatusChange(st.id, value)}
                            className={`rounded border px-3 py-1.5 font-semibold disabled:opacity-50 ${st.status === value
                              ? value === 'PRESENT' ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                                : value === 'ABSENT' ? 'border-rose-500 bg-rose-100 text-rose-800'
                                : 'border-slate-500 bg-slate-100'
                              : 'border-slate-200 hover:bg-slate-100'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
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
          <div aria-live="polite" className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <span>Present: <strong className="text-emerald-600">{localStats.present}</strong></span>
            <span>Absent: <strong className="text-rose-600">{localStats.absent}</strong></span>
            <span>Unmarked: <strong className="text-slate-700">{localStats.missing}</strong></span>
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
