import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  Linking,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AttendanceCard from '@/components/student/AttendanceCard';
import EmptyState from '@/components/student/EmptyState';
import StatusBadge from '@/components/student/StatusBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Navy, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import {
  Assignment,
  ActiveAttendanceSession,
  AttendanceSummary,
  checkInToAttendanceSession,
  getActiveStudentAttendanceSessions,
  getStudentAssignments,
  getStudentAttendance,
  getStudentProjects,
  getStudentSubjects,
  getStudentStudyPlans,
  submitStudentAssignment,
  Project,
  StudyPlan,
} from '@/services/studentService';

type MainTab = 'attendance' | 'assignments' | 'projects' | 'study_plan';
type AssignmentFilter = 'ALL' | 'Pending' | 'Submitted' | 'Evaluated' | 'Overdue';

export default function AcademicsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>('attendance');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('ALL');

  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [subjectEnrollments, setSubjectEnrollments] = useState<any[]>([]);
  const [subjectsError, setSubjectsError] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [assignmentsError, setAssignmentsError] = useState('');
  const [projectsError, setProjectsError] = useState('');
  const [studyPlansError, setStudyPlansError] = useState('');
  const [activeSessions, setActiveSessions] = useState<ActiveAttendanceSession[]>([]);
  const [activeSessionsError, setActiveSessionsError] = useState('');
  const [joinCodes, setJoinCodes] = useState<Record<number, string>>({});
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [checkInError, setCheckInError] = useState('');
  const [clockNow, setClockNow] = useState(Date.now());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);

  const fetchData = async () => {
    const [attRes, subjectRes, assignRes, projRes, planRes] = await Promise.allSettled([
      getStudentAttendance(), getStudentSubjects(), getStudentAssignments(), getStudentProjects(), getStudentStudyPlans(),
    ]);
    if (attRes.status === 'fulfilled') {
      setAttendance(attRes.value.data);
      setAttendanceError('');
    } else {
      setAttendance(null);
      setAttendanceError('Attendance is unavailable right now. Refresh to try again.');
    }
    if (subjectRes.status === 'fulfilled') {
      setSubjectEnrollments(subjectRes.value.data?.enrollments ?? []);
      setSubjectsError('');
    } else {
      setSubjectEnrollments([]);
      setSubjectsError('Enrolled subjects are unavailable right now. Refresh to try again.');
    }
    if (assignRes.status === 'fulfilled') {
      setAssignments(assignRes.value.data?.assignments ?? []);
      setAssignmentsError('');
    } else {
      setAssignments([]);
      setAssignmentsError('Assignments are unavailable because no student assignments service is connected.');
    }
    if (projRes.status === 'fulfilled') {
      setProjects(projRes.value.data?.projects ?? []);
      setProjectsError('');
    } else {
      setProjects([]);
      setProjectsError('Projects are unavailable because no student projects service is connected.');
    }
    if (planRes.status === 'fulfilled') {
      setStudyPlans(planRes.value.data?.studyPlans ?? []);
      setStudyPlansError('');
    } else {
      setStudyPlans([]);
      setStudyPlansError('Study plans are unavailable because no student study plans service is connected.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(useCallback(() => {
    let focused = true;
    const loadActiveSessions = async () => {
      try {
        const { data } = await getActiveStudentAttendanceSessions();
        if (focused) {
          setActiveSessions(data.sessions);
          setActiveSessionsError('');
        }
      } catch {
        if (focused) {
          setActiveSessions([]);
          setActiveSessionsError('Unable to load eligible active attendance sessions.');
        }
      }
    };
    loadActiveSessions();
    const poll = setInterval(loadActiveSessions, 5000);
    return () => {
      focused = false;
      clearInterval(poll);
    };
  }, []));

  useFocusEffect(useCallback(() => {
    let focused = true;
    const refreshAttendance = async () => {
      try {
        const { data } = await getStudentAttendance();
        if (focused) {
          setAttendance(data);
          setAttendanceError('');
        }
      } catch {
        if (focused) {
          setAttendance(null);
          setAttendanceError('Attendance is unavailable right now. Refresh to try again.');
        }
      }
    };
    const poll = setInterval(refreshAttendance, 15000);
    return () => {
      focused = false;
      clearInterval(poll);
    };
  }, []));

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const overallPct = attendance?.overallPercentage;
  const ringColor = overallPct === null || overallPct === undefined ? '#94A3B8' : '#0284C7';
  const ringBg = overallPct === null || overallPct === undefined ? '#F8FAFC' : '#F0F9FF';

  const handleCheckIn = async (session: ActiveAttendanceSession) => {
    setCheckingInId(session.id);
    setCheckInError('');
    try {
      const result = await checkInToAttendanceSession(session.id, joinCodes[session.id] || '');
      await fetchData();
      const activeRes = await getActiveStudentAttendanceSessions();
      setActiveSessions(activeRes.data.sessions);
      Alert.alert('Attendance confirmed', result.data.alreadyCheckedIn
        ? 'Your attendance was already recorded as present.'
        : 'The server recorded your attendance as present.');
      setJoinCodes((current) => ({ ...current, [session.id]: '' }));
    } catch (error: any) {
      setCheckInError(error?.response?.data?.message || error?.message || 'Attendance could not be confirmed.');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleAssignmentSubmit = async (assignment: Assignment) => {
    if (!submissionText.trim()) {
      Alert.alert('Response required', 'Enter your response before submitting.');
      return;
    }
    setSubmittingAssignmentId(assignment.id);
    try {
      const response = await submitStudentAssignment(assignment.id, { responseText: submissionText.trim() });
      if (response.data?.success !== true || !response.data?.submission?.id) throw new Error('The server did not confirm the submission.');
      setSubmissionText('');
      await fetchData();
      Alert.alert('Submission received', 'The server saved your assignment response.');
    } catch (error: any) {
      Alert.alert('Submission unavailable', error?.response?.data?.message || error?.message || 'Your response was not submitted.');
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const formatRemaining = (session: ActiveAttendanceSession) => {
    const serverNow = clockNow - (session.serverClockOffsetMs || 0);
    const seconds = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - serverNow) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const filteredAssignments = assignments.filter((a) => {
    if (assignmentFilter === 'ALL') return true;
    return a.status === assignmentFilter;
  });

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Screen Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerSubtitle}>Academics Overview</ThemedText>
            <ThemedText style={styles.headerTitle}>Curriculum & Progress</ThemedText>
          </View>
          <View style={styles.semesterBadge}>
            <ThemedText style={styles.semesterText}>
              {user?.profile?.semester ? `Sem ${user.profile.semester}` : 'Sem —'}{' '}
              ({user?.profile?.academicYear ?? 'Academic year unavailable'})
            </ThemedText>
          </View>
        </View>

        {/* ── Top Scrollable Segmented Tabs ── */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'attendance', label: 'Attendance', icon: 'stats-chart-outline' },
              { id: 'assignments', label: 'Assignments', icon: 'clipboard-outline' },
              { id: 'projects', label: 'Projects', icon: 'git-network-outline' },
              { id: 'study_plan', label: 'Study Plans', icon: 'book-outline' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.id as MainTab)}>
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? '#FFFFFF' : '#64748B'}
                  />
                  <ThemedText
                    style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {tab.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Navy.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Navy.primary}
                colors={[Navy.primary]}
              />
            }>
            {/* ══════════════════════════════════════════════════════
                TAB 1: ATTENDANCE OVERVIEW (Phase 3)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <>
                {/* ── Circular Gauge Attendance Card ── */}
                <View style={styles.circularGaugeCard}>
                  <View style={styles.gaugeHeader}>
                    <ThemedText style={styles.gaugeCardTitle}>Aggregate Attendance</ThemedText>
                    {attendance ? <StatusBadge status="ACTIVE" label="Recorded data" size="sm" /> : null}
                  </View>

                  <View style={styles.gaugeCenterRow}>
                    {/* Concentric Modern Circular Indicator */}
                    <View style={[styles.outerCircle, { borderColor: ringColor, backgroundColor: ringBg }]}>
                      <View style={styles.innerCircle}>
                        <ThemedText style={[styles.gaugePercentage, { color: ringColor }]}>
                          {overallPct === null || overallPct === undefined ? '—' : `${overallPct}%`}
                        </ThemedText>
                        <ThemedText style={styles.gaugeCaption}>Overall</ThemedText>
                      </View>
                    </View>

                    {/* Breakdown Metrics */}
                    <View style={styles.metricsColumn}>
                      <View style={styles.breakdownRow}>
                        <View style={[styles.dotIndicator, { backgroundColor: '#10B981' }]} />
                        <ThemedText style={styles.breakdownLabel}>Attended:</ThemedText>
                        <ThemedText style={styles.breakdownValue}>
                          {attendance ? `${attendance.totalPresent} classes` : '—'}
                        </ThemedText>
                      </View>

                      <View style={styles.breakdownRow}>
                        <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
                        <ThemedText style={styles.breakdownLabel}>Absent:</ThemedText>
                        <ThemedText style={styles.breakdownValue}>
                          {attendance ? `${attendance.totalAbsent} classes` : '—'}
                        </ThemedText>
                      </View>

                      <View style={styles.breakdownRow}>
                        <View style={[styles.dotIndicator, { backgroundColor: '#94A3B8' }]} />
                        <ThemedText style={styles.breakdownLabel}>Unmarked:</ThemedText>
                        <ThemedText style={styles.breakdownValue}>
                          {attendance ? `${attendance.unmarkedCount} sessions` : '—'}
                        </ThemedText>
                      </View>

                      <View style={styles.breakdownDivider} />

                      <View style={styles.breakdownRow}>
                        <Ionicons name="school-outline" size={14} color="#64748B" />
                        <ThemedText style={styles.breakdownLabel}>Lectures:</ThemedText>
                        <ThemedText style={styles.breakdownValueBold}>
                          {attendance ? `${attendance.totalApplicableLectures}` : '—'}
                        </ThemedText>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Ionicons name="flask-outline" size={14} color="#64748B" />
                        <ThemedText style={styles.breakdownLabel}>Lab sessions:</ThemedText>
                        <ThemedText style={styles.breakdownValueBold}>
                          {attendance ? `${attendance.totalApplicableLabSessions}` : '—'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.advisoryBanner, styles.advisoryGood]}>
                    <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
                    <ThemedText style={[styles.advisoryText, { color: '#075985' }]}>
                      {attendance?.attendanceBasis || 'Attendance information is unavailable.'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Active Attendance Sessions</ThemedText>
                  <ThemedText style={styles.sectionMeta}>Refreshes every 5 seconds</ThemedText>
                </View>
                {activeSessionsError ? (
                  <EmptyState icon="alert-circle-outline" title="Sessions Unavailable" message={activeSessionsError} />
                ) : activeSessions.length === 0 ? (
                  <EmptyState icon="time-outline" title="No Active Sessions" message="No active faculty attendance session currently matches your class and enrollment." />
                ) : activeSessions.map((session) => {
                  const remaining = formatRemaining(session);
                  const expired = remaining === '00:00';
                  return (
                    <View key={session.id} style={styles.activeSessionCard}>
                      <View style={styles.activeSessionHeader}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.activeSessionSubject}>{session.subject.name}</ThemedText>
                          <ThemedText style={styles.activeSessionMeta}>{session.subject.code} · {session.faculty}</ThemedText>
                        </View>
                        <ThemedText style={[styles.sessionTimer, expired && styles.sessionExpired]}>
                          {expired ? 'Expired' : remaining}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.activeSessionMeta}>
                        {session.academicYear} · {session.year} · Semester {session.semester} · Division {session.division}{session.labBatch ? ` · Lab ${session.labBatch}` : ''}
                      </ThemedText>
                      {session.attendanceStatus === 'PRESENT' ? (
                        <ThemedText style={styles.confirmedText}>Your attendance is recorded as present.</ThemedText>
                      ) : session.attendanceStatus === 'ABSENT' ? (
                        <ThemedText style={styles.checkInError}>Attendance is already marked. Contact faculty if it needs correction.</ThemedText>
                      ) : (
                        <View style={styles.checkInRow}>
                          <TextInput
                            value={joinCodes[session.id] || ''}
                            onChangeText={(value) => setJoinCodes((current) => ({ ...current, [session.id]: value.replace(/\D/g, '').slice(0, 6) }))}
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholder="Six-digit code"
                            placeholderTextColor="#94A3B8"
                            style={styles.joinCodeInput}
                            accessibilityLabel="Six-digit attendance code"
                          />
                          <Pressable
                            style={({ pressed }) => [styles.checkInButton, pressed && styles.pressed, (expired || checkingInId === session.id || (joinCodes[session.id] || '').length !== 6) && styles.disabledButton]}
                            disabled={expired || checkingInId === session.id || (joinCodes[session.id] || '').length !== 6}
                            onPress={() => handleCheckIn(session)}>
                            <ThemedText style={styles.checkInButtonText}>{checkingInId === session.id ? 'Checking…' : 'Check in'}</ThemedText>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
                {checkInError ? <ThemedText style={styles.checkInError}>{checkInError}</ThemedText> : null}

                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Enrolled Subjects</ThemedText>
                  <ThemedText style={styles.sectionMeta}>{subjectsError ? 'Unavailable' : `${subjectEnrollments.length} records`}</ThemedText>
                </View>
                {subjectsError ? (
                  <EmptyState icon="alert-circle-outline" title="Subjects Unavailable" message={subjectsError} />
                ) : subjectEnrollments.length === 0 ? (
                  <EmptyState icon="book-outline" title="No Subject Enrollments" message="No subject enrollment records are available for your profile." />
                ) : subjectEnrollments.map((enrollment) => {
                  const subject = enrollment.subject;
                  const matchingFaculty = (subject?.facultyAssignments || []).filter((assignment: any) =>
                    assignment.academicYear === enrollment.academicYear
                  );
                  const facultyNames = [...new Set(matchingFaculty.map((assignment: any) => assignment.faculty?.user?.name).filter(Boolean))];
                  return (
                    <View key={enrollment.id} style={styles.enrolledSubjectCard}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.activeSessionSubject}>{subject?.subjectName || 'Subject name unavailable'}</ThemedText>
                        <ThemedText style={styles.activeSessionMeta}>
                          {subject?.subjectCode || 'Code unavailable'} · {enrollment.academicYear} · {enrollment.status}
                        </ThemedText>
                        <ThemedText style={styles.activeSessionMeta}>
                          {facultyNames.length ? facultyNames.join(', ') : 'Faculty assignment unavailable'}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}

                {/* ── Subject-Wise Attendance (AttendanceCard) ── */}
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Course-wise Attendance</ThemedText>
                  <ThemedText style={styles.sectionMeta}>
                    {attendanceError ? 'Unavailable' : `${attendance?.subjects?.length ?? 0} Subjects`}
                  </ThemedText>
                </View>

                {attendanceError ? (
                  <EmptyState icon="alert-circle-outline" title="Attendance Unavailable" message={attendanceError} />
                ) : (attendance?.subjects ?? []).length === 0 ? (
                  <EmptyState
                    icon="book-outline"
                    title="No Completed Attendance"
                    message="There are no completed attendance sessions for your enrolled subjects yet."
                  />
                ) : (
                  attendance?.subjects.map((sub) => (
                    <AttendanceCard
                      key={sub.id}
                      item={sub}
                      minRequired={attendance?.minimumRequired ?? null}
                    />
                  ))
                )}

                {/* ── Recent Attendance History Log ── */}
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Recent Attendance History</ThemedText>
                  <ThemedText style={styles.sectionMeta}>Latest Sessions</ThemedText>
                </View>

                {attendanceError ? (
                  <EmptyState icon="alert-circle-outline" title="History Unavailable" message={attendanceError} />
                ) : (attendance?.history ?? []).length === 0 ? (
                  <EmptyState icon="calendar-outline" title="No Attendance History" message="No attendance records have been finalized for you yet." />
                ) : <View style={styles.historyList}>
                  {(attendance?.history ?? []).map((h) => (
                    <View key={h.id} style={styles.historyItem}>
                      <View style={styles.historyLeft}>
                        <ThemedText style={styles.historySubject}>{h.subject}</ThemedText>
                        <View style={styles.historyTimeRow}>
                          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                          <ThemedText style={styles.historyDate}>{h.date}</ThemedText>
                          <ThemedText style={styles.historyDot}>•</ThemedText>
                          <Ionicons name="time-outline" size={12} color="#94A3B8" />
                          <ThemedText style={styles.historyTime}>{h.time}</ThemedText>
                        </View>
                        <ThemedText style={styles.historyDate}>
                          {h.sessionType} · Division {h.division}{h.labBatch ? ` · ${h.labBatch}` : ''} · {h.faculty || 'Faculty unavailable'}
                        </ThemedText>
                      </View>
                      <StatusBadge
                        status={
                          h.status === 'PRESENT'
                            ? 'PRESENT'
                            : h.status === 'ABSENT'
                            ? 'ABSENT'
                            : 'ABSENT'
                        }
                        size="sm"
                      />
                    </View>
                  ))}
                </View>}
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 2: ASSIGNMENTS (Phase 5)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'assignments' && (
              <>
                {/* Filter Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipRow}>
                  {(['ALL', 'Pending', 'Submitted', 'Evaluated', 'Overdue'] as AssignmentFilter[]).map(
                    (filter) => {
                      const isSelected = assignmentFilter === filter;
                      const count =
                        filter === 'ALL'
                          ? assignments.length
                          : assignments.filter((a) => a.status === filter).length;
                      return (
                        <Pressable
                          key={filter}
                          style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                          onPress={() => setAssignmentFilter(filter)}>
                          <ThemedText
                            style={[
                              styles.filterChipText,
                              isSelected && styles.filterChipTextSelected,
                            ]}>
                            {filter} ({count})
                          </ThemedText>
                        </Pressable>
                      );
                    }
                  )}
                </ScrollView>

                {assignmentsError ? (
                  <EmptyState icon="alert-circle-outline" title="Assignments Unavailable" message={assignmentsError} />
                ) : filteredAssignments.length === 0 ? (
                  <EmptyState
                    icon="clipboard-outline"
                    title="No Assignments Found"
                    message={`No ${assignmentFilter.toLowerCase()} assignments currently.`}
                  />
                ) : (
                  filteredAssignments.map((a) => {
                    const isExpanded = expandedAssignmentId === a.id;
                    const isOverdue = a.status === 'Overdue';

                    return (
                      <View
                        key={a.id}
                        style={[styles.assignCard, isOverdue && styles.assignCardOverdue]}
                        >
                        <Pressable style={styles.assignTopRow} onPress={() => setExpandedAssignmentId(isExpanded ? null : a.id)}>
                          <View style={styles.assignInfo}>
                            <ThemedText style={styles.assignTitle}>{a.title}</ThemedText>
                            <ThemedText style={styles.assignSubject}>
                              {a.subject} • {a.faculty}
                            </ThemedText>
                          </View>
                          <StatusBadge
                            status={
                              a.status === 'Pending'
                                ? 'PENDING'
                                : a.status === 'Submitted'
                                ? 'APPROVED'
                                : a.status === 'Evaluated'
                                ? 'EVALUATED'
                                : 'OVERDUE'
                            }
                            label={a.status}
                            size="sm"
                          />
                        </Pressable>

                        {/* Marks & Due Date Row */}
                        <View style={styles.assignMetaRow}>
                          <View style={styles.assignMetaItem}>
                            <Ionicons name="calendar-outline" size={13} color="#64748B" />
                            <ThemedText style={styles.assignMetaText}>Due: {a.dueDate}</ThemedText>
                          </View>
                          {a.daysLeft && (
                            <View style={styles.assignMetaItem}>
                              <Ionicons name="hourglass-outline" size={13} color="#F59E0B" />
                              <ThemedText style={styles.daysLeftText}>{a.daysLeft}</ThemedText>
                            </View>
                          )}
                          {a.marks && (
                            <View style={styles.marksBadge}>
                              <ThemedText style={styles.marksText}>{a.marks}</ThemedText>
                            </View>
                          )}
                        </View>
                        {/* Expandable details: Instructions */}
                        {isExpanded && (
                          <View style={styles.assignExpandedContent}>
                            {a.description ? <><ThemedText style={styles.assignDescLabel}>Instructions & Scope:</ThemedText><ThemedText style={styles.assignDescText}>{a.description}</ThemedText></> : null}
                            {a.attachmentUrl ? <Pressable onPress={() => Linking.openURL(a.attachmentUrl!)}><ThemedText style={styles.unavailableAction}>Open assignment attachment</ThemedText></Pressable> : null}
                            {a.submission ? (
                              <View style={styles.assignSubmissionBox}>
                                <ThemedText style={styles.assignDescLabel}>Your submission</ThemedText>
                                <ThemedText style={styles.assignDescText}>{a.submission.responseText || a.submission.attachmentName || 'Submitted response'}</ThemedText>
                                {a.feedback ? <ThemedText style={styles.assignDescText}>Feedback: {a.feedback}</ThemedText> : null}
                              </View>
                            ) : isOverdue ? <ThemedText style={styles.unavailableAction}>The deadline has passed.</ThemedText> : (
                              <View style={styles.assignSubmissionBox}>
                                <ThemedText style={styles.assignDescLabel}>Submit response</ThemedText>
                                <TextInput value={submissionText} onChangeText={setSubmissionText} multiline placeholder="Write your response" placeholderTextColor="#94A3B8" style={styles.assignmentResponseInput} />
                                <Pressable disabled={submittingAssignmentId === a.id} onPress={() => handleAssignmentSubmit(a)} style={[styles.checkInButton, submittingAssignmentId === a.id && styles.disabledButton]}>
                                  <ThemedText style={styles.checkInButtonText}>{submittingAssignmentId === a.id ? 'Submitting…' : 'Submit assignment'}</ThemedText>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 3: PROJECTS (Phase 5)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'projects' && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Academic Projects</ThemedText>
                  <ThemedText style={styles.sectionMeta}>{projects.length} Active</ThemedText>
                </View>

                {projectsError ? (
                  <EmptyState icon="alert-circle-outline" title="Projects Unavailable" message={projectsError} />
                ) : projects.length === 0 ? (
                  <EmptyState
                    icon="git-network-outline"
                    title="No Projects Assigned"
                    message="You do not have any group or capstone projects assigned yet."
                  />
                ) : (
                  projects.map((proj) => (
                    <View key={proj.id} style={styles.projectCard}>
                      <View style={styles.projectHeader}>
                        <ThemedText style={styles.projectTitle}>{proj.name}</ThemedText>
                        <StatusBadge
                          status={proj.status === 'Completed' ? 'APPROVED' : 'ACTIVE'}
                          label={proj.status}
                          size="sm"
                        />
                      </View>
                      <ThemedText style={styles.projectSubject}>{proj.subject}</ThemedText>

                      <View style={styles.projectMetaGrid}>
                        <View style={styles.projectMetaItem}>
                          <Ionicons name="person-outline" size={13} color="#64748B" />
                          <ThemedText style={styles.projectMetaText}>Mentor: {proj.mentor}</ThemedText>
                        </View>
                        <View style={styles.projectMetaItem}>
                          <Ionicons name="people-outline" size={13} color="#64748B" />
                          <ThemedText style={styles.projectMetaText}>{proj.team}</ThemedText>
                        </View>
                        <View style={styles.projectMetaItem}>
                          <Ionicons name="calendar-outline" size={13} color="#64748B" />
                          <ThemedText style={styles.projectMetaText}>Target: {proj.deadline}</ThemedText>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.projectProgressBox}>
                        <View style={styles.progressHeaderRow}>
                          <ThemedText style={styles.progressLabel}>Sprint Milestone Progress</ThemedText>
                          <ThemedText style={styles.progressPct}>{proj.progress}%</ThemedText>
                        </View>
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${proj.progress}%`,
                                backgroundColor: proj.progress >= 80 ? '#10B981' : '#3B82F6',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {/* ══════════════════════════════════════════════════════
                TAB 4: STUDY PLAN & NOTES (Phase 5)
            ══════════════════════════════════════════════════════ */}
            {activeTab === 'study_plan' && (
              <>
                <View style={styles.sectionHeader}>
                  <ThemedText style={styles.sectionTitle}>Syllabus & Lecture Notes</ThemedText>
                  <ThemedText style={styles.sectionMeta}>{user?.profile?.semester ? `Semester ${user.profile.semester}` : 'Academic period unavailable'}</ThemedText>
                </View>

                {studyPlansError ? (
                  <EmptyState icon="alert-circle-outline" title="Study Plans Unavailable" message={studyPlansError} />
                ) : studyPlans.length === 0 ? (
                  <EmptyState
                    icon="book-outline"
                    title="No Study Material"
                    message="Department faculty has not published course notes yet."
                  />
                ) : (
                  studyPlans.map((plan) => (
                    <View key={plan.id} style={styles.studyPlanCard}>
                      <View style={styles.planIconCircle}>
                        <Ionicons name="document-text" size={24} color="#3B82F6" />
                      </View>
                      <View style={styles.planDetails}>
                        <ThemedText style={styles.planSubject}>{plan.subject}</ThemedText>
                        <ThemedText style={styles.planFileName} numberOfLines={1}>
                          {plan.fileName}
                        </ThemedText>
                        <View style={styles.planMetaRow}>
                          <ThemedText style={styles.planMetaText}>By {plan.faculty}</ThemedText>
                          {plan.fileSize && (
                            <>
                              <ThemedText style={styles.planMetaDot}>•</ThemedText>
                              <ThemedText style={styles.planMetaText}>{plan.fileSize}</ThemedText>
                            </>
                          )}
                        </View>
                      </View>
                      {plan.fileUrl ? <Pressable style={styles.downloadBtn} onPress={() => Linking.openURL(plan.fileUrl!)} accessibilityRole="button" accessibilityLabel="Open study plan"><Ionicons name="download-outline" size={18} color="#2563EB" /></Pressable> : <ThemedText style={styles.planMetaText}>No file</ThemedText>}
                    </View>
                  ))
                )}
              </>
            )}

            <View style={{ height: BottomTabInset + Spacing.four }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Navy.primary,
    letterSpacing: -0.3,
  },
  semesterBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  semesterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  tabContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: Navy.primary,
    borderColor: Navy.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  circularGaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 4,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
  },
  gaugeCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  outerCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  gaugePercentage: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeCaption: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricsColumn: {
    flex: 1,
    paddingLeft: 20,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: Navy.primary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  activeSessionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
    gap: 9,
  },
  enrolledSubjectCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 13 },
  activeSessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeSessionSubject: { color: Navy.primary, fontSize: 15, fontWeight: '800' },
  activeSessionMeta: { color: '#64748B', fontSize: 12, lineHeight: 17 },
  sessionTimer: { color: '#047857', fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  sessionExpired: { color: '#B91C1C' },
  checkInRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinCodeInput: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: Navy.primary, letterSpacing: 3, fontSize: 16 },
  checkInButton: { backgroundColor: Navy.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  checkInButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
  confirmedText: { color: '#047857', fontSize: 13, fontWeight: '700' },
  checkInError: { color: '#B91C1C', fontSize: 12, lineHeight: 17 },
  unavailableAction: { color: '#64748B', fontSize: 12, marginTop: 10 },
  advisoryGood: {
    backgroundColor: '#EFF6FF',
  },
  advisoryWarning: {
    backgroundColor: '#FFFBEB',
  },
  advisoryText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Navy.primary,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  historyList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  historyLeft: {
    flex: 1,
    marginRight: 10,
  },
  historySubject: {
    fontSize: 14,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 3,
  },
  historyTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
  },
  historyDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  historyTime: {
    fontSize: 11,
    color: '#64748B',
  },
  filterChipRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  assignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  assignCardOverdue: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFA',
  },
  assignTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  assignInfo: {
    flex: 1,
    marginRight: 12,
  },
  assignTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 3,
  },
  assignSubject: {
    fontSize: 12,
    color: '#64748B',
  },
  assignMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  assignMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  marksBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  marksText: {
    fontSize: 11,
    fontWeight: '700',
    color: Navy.primary,
  },
  assignExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  assignSubmissionBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignmentResponseInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  assignDescLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  assignDescText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  assignActionRow: {
    alignItems: 'flex-start',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Navy.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Navy.primary,
    flex: 1,
    marginRight: 8,
  },
  projectSubject: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  projectMetaGrid: {
    gap: 6,
    marginBottom: 14,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectMetaText: {
    fontSize: 12,
    color: '#475569',
  },
  projectProgressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
    color: Navy.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  studyPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  planIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planDetails: {
    flex: 1,
  },
  planSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: Navy.primary,
    marginBottom: 2,
  },
  planFileName: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 2,
  },
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  planMetaDot: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
