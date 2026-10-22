const VALID_YEARS = ["FY", "SY", "TY", "BE"];
const SEMESTERS_BY_YEAR = {
  FY: [1, 2],
  SY: [3, 4],
  TY: [5, 6],
  BE: [7, 8],
};
const PROGRAMS = ["B.Tech", "B.E."];
const DIVISIONS = ["A", "B", "C"];
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Spouse", "Sibling", "Other"];

function academicYearOptions(count = 6) {
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let i = -2; i < count - 2; i += 1) {
    const year = startYear + i;
    years.push(`${year}-${String(year + 1).slice(-2)}`);
  }
  return years;
}

function generateStudentId() {
  return `REG${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function parseDateOfBirth(value) {
  const raw = emptyToNull(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("Date of birth is invalid");
    error.statusCode = 422;
    throw error;
  }
  if (parsed > new Date()) {
    const error = new Error("Date of birth cannot be in the future");
    error.statusCode = 422;
    throw error;
  }
  return parsed;
}

function assertSemesterForYear(year, semester) {
  const allowed = SEMESTERS_BY_YEAR[year];
  if (!allowed || !allowed.includes(Number(semester))) {
    const error = new Error(
      `Semester ${semester} is not valid for ${year}. Allowed: ${allowed ? allowed.join(", ") : "none"}`
    );
    error.statusCode = 422;
    throw error;
  }
}

function registrationOptions(departments) {
  return {
    departments,
    programs: PROGRAMS,
    years: VALID_YEARS,
    semestersByYear: SEMESTERS_BY_YEAR,
    divisions: DIVISIONS,
    academicYears: academicYearOptions(),
    genders: GENDERS,
    bloodGroups: BLOOD_GROUPS,
    relationships: RELATIONSHIPS,
  };
}

module.exports = {
  VALID_YEARS,
  SEMESTERS_BY_YEAR,
  PROGRAMS,
  DIVISIONS,
  GENDERS,
  BLOOD_GROUPS,
  RELATIONSHIPS,
  academicYearOptions,
  generateStudentId,
  emptyToNull,
  parseDateOfBirth,
  assertSemesterForYear,
  registrationOptions,
};
