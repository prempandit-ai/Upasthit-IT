const BATCHES_BY_DIVISION = Object.freeze({
  A: Object.freeze(["A1", "A2", "A3"]),
  B: Object.freeze(["B1", "B2", "B3"]),
});

function normalizeDivision(value) {
  if (value == null) return "";
  return String(value).trim().replace(/^(section|division|div)\s*/i, "").toUpperCase();
}

function automaticLabBatch(rollNo, division) {
  const normalizedDivision = normalizeDivision(division);
  const batches = BATCHES_BY_DIVISION[normalizedDivision];
  if (!batches || !Number.isInteger(Number(rollNo))) return null;
  const roll = Number(rollNo);
  if (roll < 1 || roll > 75) return null;
  return batches[Math.floor((roll - 1) / 25)];
}

function isValidLabBatch(batch, division) {
  return Boolean(BATCHES_BY_DIVISION[normalizeDivision(division)]?.includes(String(batch || "").toUpperCase()));
}

function allocationPreview(students) {
  const rollCounts = new Map();
  for (const student of students) {
    if (!Number.isInteger(student.rollNo)) continue;
    const key = [student.academicYear, student.year, normalizeDivision(student.division), student.rollNo].join("|");
    rollCounts.set(key, (rollCounts.get(key) || 0) + 1);
  }

  return students.map((student) => {
    const division = normalizeDivision(student.division);
    const issues = [];
    if (student.rollNo == null) issues.push("MISSING_ROLL_NUMBER");
    else if (!Number.isInteger(student.rollNo) || student.rollNo < 1) issues.push("INVALID_ROLL_NUMBER");
    else if (student.rollNo > 75) issues.push("OUT_OF_RANGE_ROLL_NUMBER");
    if (!BATCHES_BY_DIVISION[division]) issues.push("INVALID_DIVISION");

    if (Number.isInteger(student.rollNo)) {
      const key = [student.academicYear, student.year, division, student.rollNo].join("|");
      if ((rollCounts.get(key) || 0) > 1) issues.push("DUPLICATE_ROLL_NUMBER");
    }

    return {
      ...student,
      division,
      suggestedBatch: issues.length ? null : automaticLabBatch(student.rollNo, division),
      allocationStatus: issues.length ? issues[0] : "READY",
      allocationIssues: issues,
    };
  });
}

module.exports = { BATCHES_BY_DIVISION, normalizeDivision, automaticLabBatch, isValidLabBatch, allocationPreview };
