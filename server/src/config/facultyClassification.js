// Explicit historical identities; independent of assignments and account activation.
// Maintain this list when faculty membership changes. No database migration required.
const HISTORICAL_FACULTY_IDS = Object.freeze(["FAC001", "FAC004"]);
const classifyFaculty = (employeeId) =>
  HISTORICAL_FACULTY_IDS.includes(employeeId) ? "HISTORICAL" : "CURRENT";
function facultyClassificationWhere(view = "current") {
  if (view === "all") return {};
  return { employeeId: view === "historical"
    ? { in: [...HISTORICAL_FACULTY_IDS] }
    : { notIn: [...HISTORICAL_FACULTY_IDS] } };
}
module.exports = { HISTORICAL_FACULTY_IDS, classifyFaculty, facultyClassificationWhere };
