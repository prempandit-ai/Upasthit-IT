const XLSX = require("xlsx");
const path = require("path");
const EXCEL_PATH = path.resolve(__dirname, "../uploads/UPASTHIT_DEMO_DATA.xlsx");
const wb = XLSX.readFile(EXCEL_PATH);

for (const sheetName of wb.SheetNames) {
  if (sheetName.toLowerCase().includes("guide")) continue;
  const ws = wb.Sheets[sheetName];
  // Get raw 2D array to see actual structure
  const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  console.log(`\n==== SHEET: "${sheetName}" ====`);
  console.log("Total rows in sheet:", arr.length);
  console.log("First 5 rows:");
  arr.slice(0, 5).forEach((row, i) => console.log(`  Row ${i+1}:`, JSON.stringify(row)));
}
