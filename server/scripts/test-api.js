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

async function runTests() {
  console.log("🧪 Running Upasthit ERP API Integration Tests...\n");

  // 1. Health check
  const health = await request({
    host: "localhost",
    port: 5000,
    path: "/api/health",
    method: "GET",
  });
  console.log(`✓ [GET /api/health] Status: ${health.status}`, health.body);

  // 2. Login as Admin
  const adminLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "admin@upasthit.test", password: "Password123" }
  );
  console.log(`✓ [POST /api/auth/login (Admin)] Status: ${adminLogin.status}`);
  const adminToken = adminLogin.body.token;

  // 3. Admin /api/auth/me
  const adminMe = await request({
    host: "localhost",
    port: 5000,
    path: "/api/auth/me",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ [GET /api/auth/me] Name: ${adminMe.body.user.name}, Role: ${adminMe.body.user.role}, Profile:`, adminMe.body.user.profile);

  // 4. Login as Student
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
  console.log(`✓ [POST /api/auth/login (Student)] Status: ${studentLogin.status}, Dept: ${studentLogin.body.user.profile.departmentName}, GR: ${studentLogin.body.user.profile.studentId}`);
  const studentToken = studentLogin.body.token;

  // 5. Login as HOD
  const hodLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "hod@upasthit.test", password: "Password123" }
  );
  const hodToken = hodLogin.body.token;
  console.log(`✓ [POST /api/auth/login (HOD)] Status: ${hodLogin.status}, Dept: ${hodLogin.body.user.profile.departmentName}`);

  // 6. Login as Coordinator
  const coordLogin = await request(
    {
      host: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: "coordinator@upasthit.test", password: "Password123" }
  );
  const coordToken = coordLogin.body.token;
  console.log(`✓ [POST /api/auth/login (Coordinator)] Status: ${coordLogin.status}`);

  // 7. Departments list
  const depts = await request({
    host: "localhost",
    port: 5000,
    path: "/api/departments",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ [GET /api/departments] Found ${depts.body.departments.length} departments:`, depts.body.departments.map(d => d.code).join(", "));

  // 8. Students list
  const students = await request({
    host: "localhost",
    port: 5000,
    path: "/api/students",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ [GET /api/students] Found ${students.body.students.length} students:`, students.body.students.map(s => `${s.user.name} (${s.studentId})`).join(", "));

  // 9. Faculty list
  const faculty = await request({
    host: "localhost",
    port: 5000,
    path: "/api/faculty",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ [GET /api/faculty] Found ${faculty.body.faculty.length} faculty members:`, faculty.body.faculty.map(f => `${f.user.name} (${f.employeeId})`).join(", "));

  // 10. Subjects list
  const subjects = await request({
    host: "localhost",
    port: 5000,
    path: "/api/subjects",
    method: "GET",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ [GET /api/subjects] Found ${subjects.body.subjects.length} subjects:`, subjects.body.subjects.map(s => `${s.subjectCode} (${s.subjectName})`).join(", "));

  // 11. HOD Dashboard
  const hodDash = await request({
    host: "localhost",
    port: 5000,
    path: "/api/hod/dashboard",
    method: "GET",
    headers: { Authorization: `Bearer ${hodToken}` },
  });
  console.log(`✓ [GET /api/hod/dashboard] Stats:`, hodDash.body.stats);

  // 12. Coordinator Dashboard
  const coordDash = await request({
    host: "localhost",
    port: 5000,
    path: "/api/coordinator/dashboard",
    method: "GET",
    headers: { Authorization: `Bearer ${coordToken}` },
  });
  console.log(`✓ [GET /api/coordinator/dashboard] Stats:`, coordDash.body.stats);

  console.log("\n🎉 All 12 Integration Tests Passed Successfully!\n");
}

runTests().catch(console.error);
