export const ATTENDANCE_STATUSES = Object.freeze(['PRESENT', 'ABSENT']);
export function markLoadedRoster(students, status) {
  if (!ATTENDANCE_STATUSES.includes(status)) throw new Error('Unsupported attendance status');
  return students.map((student) => student.eligible === false ? student : ({ ...student, status }));
}
export function attendanceCounts(students) {
  students = students.filter((student) => student.eligible !== false);
  const present = students.filter((student) => student.status === 'PRESENT').length;
  const absent = students.filter((student) => student.status === 'ABSENT').length;
  return { total: students.length, present, absent, marked: present + absent,
    missing: students.length - present - absent };
}
export function attendanceRecords(students) {
  return students.filter((student) => student.eligible !== false && student.status).map((student) => {
    if (!ATTENDANCE_STATUSES.includes(student.status)) throw new Error('Unsupported attendance status. Reload the roster.');
    return { studentId: student.id, status: student.status };
  });
}
export function rosterShortcut(students, focusedId, key) {
  if (!students.length || !['arrowup', 'arrowdown', 'p', 'a'].includes(key)) return null;
  const index = Math.max(0, students.findIndex((student) => student.id === focusedId));
  const next = key === 'arrowdown' ? Math.min(index + 1, students.length - 1)
    : key === 'arrowup' ? Math.max(0, index - 1) : index;
  return { id: students[next].id, status: students[next].eligible === false ? null
    : key === 'p' ? 'PRESENT' : key === 'a' ? 'ABSENT' : null };
}
