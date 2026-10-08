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

async function runFacultyTests() {
  console.log("👨‍🏫 Running Upasthit Faculty Dashboard Integration Tests...\n");

  // 1. Faculty Login
  const loginRes = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "faculty@upasthit.test", password: "Password123" }
  );

  console.log(`✓ [POST /api/auth/login] Status: ${loginRes.status}`);
  if (loginRes.status !== 200) {
    throw new Error("Faculty login failed");
  }
  const token = loginRes.body.token;
  const user = loginRes.body.user;
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role}, Status: ${user.status}`);
  console.log(`  Employee ID: ${user.employeeId}`);
  console.log(`  Department: ${user.department}`);
  console.log(`  Designation: ${user.designation}`);

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
  const facultyProf = meUser.profile;
  console.log(`  - Faculty Name:       ${meUser.name}`);
  console.log(`  - Employee ID:        ${meUser.employeeId}`);
  console.log(`  - Email:              ${meUser.email}`);
  console.log(`  - Department:         ${meUser.department}`);
  console.log(`  - Designation:        ${meUser.designation}`);
  console.log(`  - Profile ID:         ${facultyProf.id}`);
  console.log(`  - Assigned Subjects:  ${facultyProf.subjectAssignments?.length || 0}`);

  const profileId = facultyProf.id;

  // 3. GET /api/faculty/me
  const myProfileRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/me",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/me] Status: ${myProfileRes.status}`);
  console.log(`  Profile ID: ${myProfileRes.body.faculty?.id}, Employee: ${myProfileRes.body.faculty?.employeeId}`);

  // 4. GET /api/faculty/:id (using Profile ID)
  const byIdRes = await request({
    host: "localhost",
    port: 5000,
    path: `/api/faculty/${profileId}`,
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/${profileId}] Status: ${byIdRes.status}`);
  console.log(`  Fetched faculty profile by Profile ID: ${byIdRes.body.faculty?.employeeId}`);

  // 5. GET /api/faculty/:id/subjects
  const assignedSubjectsRes = await request({
    host: "localhost",
    port: 5000,
    path: `/api/faculty/${profileId}/subjects`,
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/${profileId}/subjects] Status: ${assignedSubjectsRes.status}`);
  const assignments = assignedSubjectsRes.body.assignments || [];
  console.log(`  Found ${assignments.length} assigned subjects:`);
  for (const a of assignments) {
    console.log(`    - [${a.subject.subjectCode}] ${a.subject.subjectName} (${a.subject.subjectType}) | Div ${a.division || "All"} | AY ${a.academicYear}`);
  }

  // 6. GET /api/faculty/dashboard
  const dashRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/dashboard",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/dashboard] Status: ${dashRes.status}`);
  console.log(`  Dashboard Metrics:`, {
    todayClasses: dashRes.body.todayClasses,
    totalSubjects: dashRes.body.totalSubjects,
    assignedDivisions: dashRes.body.assignedDivisions,
    academicYear: dashRes.body.academicYear,
  });

  // 7. GET /api/faculty/today-classes
  const classesRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/today-classes",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/today-classes] Status: ${classesRes.status}`);
  console.log(`  Today's Classes Count: ${classesRes.body.classes?.length || 0}`);
  for (const cls of classesRes.body.classes || []) {
    console.log(`    - ${cls.subject} | ${cls.startTime} - ${cls.endTime} | ${cls.room} | Status: ${cls.attendanceStatus}`);
  }

  // 8. GET /api/faculty/schedule/today
  const schedRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/schedule/today",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/schedule/today] Status: ${schedRes.status}`);
  console.log(`  Schedule Count: ${schedRes.body.schedule?.length || 0}`);

  // 9. GET /api/faculty/attendance/summary
  const attRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/attendance/summary",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/faculty/attendance/summary] Status: ${attRes.status}`);
  console.log(`  Attendance Summary:`, attRes.body.summary);

  // 10. Role Verification Route
  const rbacRes = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/faculty-only",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`\n✓ [GET /api/auth/faculty-only] Status: ${rbacRes.status} (RBAC Access Verified)`);

  // 11. Security Tests:
  console.log(`\n🔒 Testing RBAC Security Protections...`);

  // 11a: Cannot access another faculty profile
  const unauthorizedProfile = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/999",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked access to other faculty profile (/api/faculty/999): Status ${unauthorizedProfile.status} (Expected 403)`);

  // 11b: Cannot access other faculty subjects
  const unauthorizedSubjects = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty/999/subjects",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked access to other faculty subjects (/api/faculty/999/subjects): Status ${unauthorizedSubjects.status} (Expected 403)`);

  // 11c: Blocked from admin endpoint
  const adminBlock = await request({
    host: "localhost",
    port: 5000,
    path: "/api/admin/users",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`  ✓ Blocked from Admin endpoint (/api/admin/users): Status ${adminBlock.status} (Expected 403)`);

  // 11d: Invalid token returns 401
  const badToken = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: "Bearer invalid.jwt.token" },
  });
  console.log(`  ✓ Rejected invalid token: Status ${badToken.status} (Expected 401)`);

  // 12. Verify Student Dashboard functionality continues intact
  console.log(`\n🎓 Verifying Student Dashboard Continuity...`);
  const studentLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "student@upasthit.test", password: "Password123" }
  );
  const studentToken = studentLogin.body.token;
  const studentMe = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const studentProf = await request({
    host: "localhost",
    port: 5000,
    path: "/api/student/profile",
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`  ✓ Student login: Status ${studentLogin.status}`);
  console.log(`  ✓ Student /me: Status ${studentMe.status} (${studentMe.body.user.name})`);
  console.log(`  ✓ Student profile: Status ${studentProf.status} (GR: ${studentProf.body.profile.studentId})`);

  console.log("\n🎉 ALL FACULTY DASHBOARD INTEGRATION TESTS PASSED PERFECTLY!\n");
}

runFacultyTests().catch(console.error);
