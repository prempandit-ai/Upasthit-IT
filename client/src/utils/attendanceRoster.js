export const mergePolledAttendanceRoster = (currentRoster, incomingRoster, manualStatuses) => {
  const currentById = new Map(currentRoster.map((student) => [student.id, student]));
  const incomingIds = new Set(incomingRoster.map((student) => student.id));
  const mergedRoster = incomingRoster.map((serverStudent) => {
    const currentStudent = currentById.get(serverStudent.id);
    if (!currentStudent) return serverStudent;
    if (manualStatuses.has(serverStudent.id)) {
      return { ...currentStudent, ...serverStudent, status: manualStatuses.get(serverStudent.id) };
    }
    return { ...currentStudent, ...serverStudent };
  });

  currentRoster.forEach((student) => {
    if (manualStatuses.has(student.id) && !incomingIds.has(student.id)) {
      mergedRoster.push({ ...student, eligible: false, status: manualStatuses.get(student.id) });
    }
  });

  return mergedRoster;
};
