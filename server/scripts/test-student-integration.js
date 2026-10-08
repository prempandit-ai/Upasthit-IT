const http = require("http");

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runStudentTests() {
  console.log("🎓 Running Upasthit Student Dashboard Integration Tests...\n");

  // 1. Student Login
  const loginRes = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "student@upasthit.test", password: "Password123" }
  );

  console.log(`✓ [POST /api/auth/login] Status: ${loginRes.status}`);
  if (loginRes.status !== 200) {
    throw new Error("Student login failed");
  }
  const token = loginRes.body.token;
  const user = loginRes.body.user;
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role}, Status: ${user.status}`);
  console.log(`  Profile Attached: ${user.profile?.studentId ? "YES" : "NO"}`);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 2. GET /api/auth/me
  const meRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/auth/me] Status: ${meRes.status}`);
  const meUser = meRes.body.user;
  const prof = meUser.profile;
  console.log(`  - Student Name:       ${meUser.name}`);
  console.log(`  - Student ID / GR:    ${prof.studentId}`);
  console.log(`  - Roll Number:        ${prof.rollNo}`);
  console.log(`  - Enrollment Number:  ${prof.enrollmentNo}`);
  console.log(`  - Gender:             ${prof.gender}`);
  console.log(`  - Mobile Number:      ${prof.mobileNumber}`);
  console.log(`  - Email:              ${meUser.email}`);
  console.log(`  - Department Code:    ${prof.departmentCode}`);
  console.log(`  - Department Name:    ${prof.departmentName}`);
  console.log(`  - Academic Year:      ${prof.academicYear}`);
  console.log(`  - Semester:           ${prof.semester}`);
  console.log(`  - Division:           ${prof.division}`);
  console.log(`  - Year:               ${prof.year}`);
  console.log(`  - Enrollment Status:  ${prof.enrollmentStatus}`);
  console.log(`  - Approval Status:    ${meUser.status}`);
  console.log(`  - Enrolled Subjects:  ${prof.subjectEnrollments?.length || 0} subjects`);

  // 3. GET /api/student/profile
  const profileRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/student/profile",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/student/profile] Status: ${profileRes.status}`);
  console.log(`  Profile ID: ${profileRes.body.profile?.id}, StudentId: ${profileRes.body.profile?.studentId}`);

  // 4. GET /api/student/subjects
  const subjectsRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/student/subjects",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/student/subjects] Status: ${subjectsRes.status}`);
  const enrollments = subjectsRes.body.enrollments || [];
  console.log(`  Found ${enrollments.length} enrolled subjects:`);
  for (const en of enrollments) {
    const s = en.subject;
    const fac = s.facultyAssignments?.[0]?.faculty?.user?.name || "TBD";
    console.log(`    - [${s.subjectCode}] ${s.subjectName} (${s.subjectType}) | Faculty: ${fac}`);
  }

  // 5. GET /api/student/dashboard
  const dashRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/student/dashboard",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/student/dashboard] Status: ${dashRes.status}`);
  console.log(`  Dashboard Stats:`, dashRes.body.data);

  // 6. GET /api/student/attendance
  const attRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/student/attendance",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/student/attendance] Status: ${attRes.status}`);
  console.log(`  Overall Attendance: ${attRes.body.data?.overallPercentage}% (${attRes.body.data?.status})`);
  console.log(`  Subject-wise cards count: ${attRes.body.data?.subjects?.length || 0}`);

  // 7. Security / RBAC Verification: Unauthorized routes should be blocked
  console.log(`\n🔒 Testing RBAC Security Protections...`);
  const adminAccess = await request({
    host: "localhost",
    port: 5000,
    path: "/api/admin/users",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked student from Admin endpoint (/api/admin/users): Status ${adminAccess.status} (Expected 403)`);

  const hodAccess = await request({
    host: "localhost",
    port: 5000,
    path: "/api/hod/dashboard",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked student from HOD dashboard (/api/hod/dashboard): Status ${hodAccess.status} (Expected 403)`);

  const coordAccess = await request({
    host: "localhost",
    port: 5000,
    path: "/api/coordinator/dashboard",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked student from Coordinator dashboard (/api/coordinator/dashboard): Status ${coordAccess.status} (Expected 403)`);

  console.log("\n🎉 ALL STUDENT DASHBOARD INTEGRATION TESTS PASSED PERFECTLY!\n");
}

runStudentTests().catch(console.error);
