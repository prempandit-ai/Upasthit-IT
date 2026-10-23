const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const prisma = require("../src/config/prisma");
const { BATCHES_BY_DIVISION, allocationPreview } = require("../src/utils/labBatch");

const args = process.argv.slice(2);
const unknownArgs = args.filter((arg) => !["--dry-run", "--apply"].includes(arg));
if (
  unknownArgs.length > 0 ||
  (args.includes("--dry-run") && args.includes("--apply")) ||
  args.filter((arg) => arg === "--dry-run" || arg === "--apply").length > 1
) {
  console.error("Usage: node scripts/allocate-student-lab-batches.js [--dry-run | --apply]");
  process.exit(2);
}

const apply = args.includes("--apply");

async function hasLabBatchColumn(client) {
  const rows = await client.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'StudentProfile'
        AND column_name = 'labBatch'
    ) AS present
  `);
  return Boolean(rows[0]?.present);
}

async function readStudents(client, { lockRows = false, hasBatchColumn = true } = {}) {
  const currentBatchColumn = hasBatchColumn ? '"labBatch"' : 'NULL::TEXT AS "labBatch"';
  const lockClause = lockRows ? "FOR UPDATE" : "";
  return client.$queryRawUnsafe(`
    SELECT id, "studentId", "rollNo", "academicYear", year, division, ${currentBatchColumn}
    FROM "StudentProfile"
    ORDER BY "academicYear", year, division, "rollNo", id
    ${lockClause}
  `);
}

function summarize(students) {
  const preview = allocationPreview(students);
  const updates = preview.filter(
    (student) => student.allocationStatus === "READY" && student.labBatch !== student.suggestedBatch
  );
  const skips = preview.filter(
    (student) => student.allocationStatus === "READY" && student.labBatch === student.suggestedBatch
  );
  const conflicts = preview.filter((student) => student.allocationStatus !== "READY");
  const groups = new Map();

  for (const student of preview) {
    if (!student.suggestedBatch) continue;
    const key = JSON.stringify([student.academicYear || "(missing)", student.year || "(missing)"]);
    if (!groups.has(key)) {
      groups.set(key, {
        academicYear: student.academicYear || "(missing)",
        year: student.year || "(missing)",
        counts: Object.fromEntries(
          Object.values(BATCHES_BY_DIVISION).flat().map((batch) => [batch, 0])
        ),
      });
    }
    groups.get(key).counts[student.suggestedBatch] += 1;
  }

  return {
    preview,
    updates,
    skips,
    conflicts,
    groups: [...groups.values()].sort((a, b) =>
      `${a.academicYear}|${a.year}`.localeCompare(`${b.academicYear}|${b.year}`)
    ),
  };
}

function printReport(students, report, { hasBatchColumn, updatedCount = null } = {}) {
  const mode = apply ? "APPLY" : "DRY RUN";
  console.log(`Mode: ${mode}`);
  console.log(`Student profiles inspected: ${students.length}`);
  console.log(
    `Operations: UPDATE ${report.updates.length}, SKIP ${report.skips.length}, CONFLICT ${report.conflicts.length}`
  );
  console.log(
    `StudentProfile.labBatch column: ${hasBatchColumn ? "present" : "not yet migrated (current values treated as empty)"}`
  );

  console.log("\nProposed allocations by academic year and student year:");
  if (report.groups.length === 0) {
    console.log("  No conflict-free student groups have an allocatable batch.");
  } else {
    for (const group of report.groups) {
      const batches = Object.entries(group.counts)
        .map(([batch, count]) => `${batch}=${count}`)
        .join(" ");
      console.log(`  academicYear=${group.academicYear} year=${group.year}: ${batches}`);
    }
  }

  if (report.updates.length) {
    console.log("\nProposed changes:");
    for (const student of report.updates) {
      console.log(
        `  Student ID=${student.studentId} profile=${student.id} Roll No.=${student.rollNo} Division=${student.division || "(missing)"} Current Batch=${student.labBatch || "(empty)"} Proposed Batch=${student.suggestedBatch}`
      );
    }
  }

  if (report.skips.length) {
    console.log("\nAlready correctly allocated (SKIP):");
    for (const student of report.skips) {
      console.log(
        `  Student ID=${student.studentId} Roll No.=${student.rollNo} Division=${student.division} Current Batch=${student.labBatch} Proposed Batch=${student.suggestedBatch}`
      );
    }
  }

  if (report.conflicts.length) {
    console.log("\nConflicts (no batch assigned):");
    for (const student of report.conflicts) {
      console.log(
        `  Student ID=${student.studentId} profile=${student.id} Roll No.=${student.rollNo ?? "(missing)"} Division=${student.division || "(missing)"} Current Batch=${student.labBatch || "(empty)"} issues=${student.allocationIssues.join(",")}`
      );
    }
  }

  if (apply) {
    console.log(`\nUpdated ${updatedCount ?? 0} student batch assignments in one transaction.`);
  } else {
    console.log("\nDry run only. No database rows were changed.");
  }
}

async function applyAllocations() {
  return prisma.$transaction(
    async (tx) => {
      const hasBatchColumn = await hasLabBatchColumn(tx);
      if (!hasBatchColumn) {
        throw new Error(
          "The StudentProfile.labBatch migration is not applied. Apply the approved migration before using --apply."
        );
      }

      const students = await readStudents(tx, { lockRows: true, hasBatchColumn });
      const report = summarize(students);
      for (const student of report.updates) {
        await tx.$executeRawUnsafe(
          'UPDATE "StudentProfile" SET "labBatch" = $1 WHERE id = $2 AND "labBatch" IS DISTINCT FROM $1',
          student.suggestedBatch,
          student.id
        );
      }
      return { students, report, hasBatchColumn, updatedCount: report.updates.length };
    },
    { timeout: 30000 }
  );
}

async function main() {
  if (apply) {
    const result = await applyAllocations();
    printReport(result.students, result.report, result);
    return;
  }

  const hasBatchColumn = await hasLabBatchColumn(prisma);
  const students = await readStudents(prisma, { hasBatchColumn });
  const report = summarize(students);
  printReport(students, report, { hasBatchColumn });
}

main()
  .catch((error) => {
    const code = error.code || error.cause?.code || error.name || "Error";
    const message = error.message || error.cause?.message || "Unknown database error";
    console.error(`Allocation ${apply ? "failed" : "dry run failed"} (${code}): ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
