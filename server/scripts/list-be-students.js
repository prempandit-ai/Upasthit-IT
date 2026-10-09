require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");

const EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_DEMO_DATA.xlsx");

function parseBEStudents() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const rawData = XLSX.utils.sheet_to_json(wb.Sheets["BE"], { header: 1 });
  const headers = rawData[1].map(h => (h ? String(h).trim() : ""));

  const students = [];
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0 || row.every(c => c === undefined || c === null || String(c).trim() === "")) continue;
    if (row.length === 1 || (row[0] && String(row[0]).includes("BE - DIV"))) continue;
    if (row[0] === "Roll No." || row[1] === "Student ID / GR No.") continue;

    const d = {};
    headers.forEach((h, idx) => {
      if (h) d[h] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
    });

    let div = d["Division"] || "";
    if (div.toLowerCase().startsWith("div ")) {
      div = div.replace(/div\s+/i, "").trim();
    }

    students.push({
      rollNo: parseInt(d["Roll No."], 10),
      studentId: d["Student ID / GR No."],
      name: d["Name of Student"],
      mobileNumber: d["Mobile Number"] || null,
      email: (d["Email ID"] || "").toLowerCase(),
      deptCode: d["Department Code"] || "IT",
      deptName: d["Department Name"] || "Information Technology",
      academicYear: d["Academic Year"],
      semester: 7,
      division: div,
      year: "BE",
      enrollmentStatus: "ACTIVE",
    });
  }
  return students;
}

const list = parseBEStudents();
console.log(`Parsed ${list.length} students:`);
console.table(list.map(s => ({
  Roll: s.rollNo,
  Div: s.division,
  ID: s.studentId,
  Name: s.name,
  Email: s.email,
  Mobile: s.mobileNumber,
  Year: s.year,
  Sem: s.semester,
  AcadYear: s.academicYear,
})));
