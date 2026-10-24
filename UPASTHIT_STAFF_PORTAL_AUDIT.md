# UPASTHIT Staff Portal Functionality Audit

**Audit date:** 2026-10-24  
**Scope:** Current checkout at `C:\Upasthit\Upasthit`, including existing uncommitted work. This is a code and read-only database audit; no application code or database rows were changed.

## A. Executive Summary

The project has five defined roles: ADMIN, HOD, COORDINATOR, FACULTY, and STUDENT. There is no NON-TEACHING STAFF role, portal route, or separate profile model in the current schema.

Several staff workflows have real frontend-to-Express-to-Prisma paths, especially account approvals, faculty attendance, subject assignments, coordinator event management, and faculty timetable/assignment APIs. However, no authenticated staff workflow was exercised end to end in this audit. Under the requested rubric, API-backed features without successful runtime verification are marked **NOT VERIFIED**.

The current Neon database reports one pending migration, `20261023143000_add_student_portal_features`. A read-only table check found that the new portal tables it introduces are absent. As a result, coordinator event/registration features, faculty timetable/assignments/study plans/notifications, and Admin fees/library/document features have code paths but currently fail when they query those absent tables. No migration was applied.

Major confirmed issues:

- Admin-created HOD and Faculty accounts are User rows only; the create handlers do not create their required HODProfile or FacultyProfile. Those accounts cannot use profile-dependent portal workflows.
- The HOD Create Coordinator form submits only name, email, and password. The controller creates the User first, then dereferences missing `employeeId` with `.trim()`. A submission therefore errors after creating an approved coordinator User without its profile.
- `POST /api/hod/profile` is guarded as HOD-only but accepts an arbitrary `userId`. The authentication middleware grants HOD access to any user that has an HODProfile, making this a role-escalation path for an authenticated HOD.
- HOD pending-faculty lists and approval actions are global rather than department-scoped.
- Multiple pages display fabricated statistics, mock records, or success messages without persistence; several service calls target routes that do not exist.

No feature is labeled **FUNCTIONAL** because successful authenticated end-to-end verification was not performed. This does not mean every connected workflow is known to fail; the tables below distinguish code-backed but unverified paths from confirmed failures and static UI.

## B. Role-wise Functionality Audit

Status uses the requested classifications. “Database connected?” means there is a source-code path to Prisma; it does not imply that a live action was executed successfully. The pending migration is called out separately.

### Admin Portal

| Feature | Frontend File | API/Backend | Database Connected? | Status | Problem / Missing Work |
|---|---|---|---|---|---|
| Login, session restoration, logout | `client/src/pages/Login.jsx`; `client/src/context/AuthContext.jsx`; `client/src/services/authService.js` | `POST /api/auth/login`, `GET /api/auth/me`; no server logout endpoint | Yes, User and profile query | NOT VERIFIED | Credential and session flows were inspected but not run with a test account. Logout clears client state; it does not revoke the server token. Login page also contains demo-account UI. |
| Admin route and API gate | `client/src/routes/AppRoutes.jsx`; `client/src/routes/RoleRoute.jsx` | `server/src/routes/admin.routes.js` applies `authenticate`, `requireApproved`, and `authorize("ADMIN")` router-wide | User row and active/status checks | NOT VERIFIED | Guards are present in code; no direct unauthorized HTTP request was executed. |
| User list, role/status filters, approve/reject/deactivate | `client/src/pages/dashboard/AdminDashboard.jsx` | `GET /api/admin/users`; `PATCH /api/admin/users/:id/{approve,reject,deactivate}` | Yes, User | NOT VERIFIED | Real calls and responses are wired. UI provides role/status filters, but no search, sorting, or pagination. Actions were not executed. |
| Create HOD / Faculty account | `client/src/pages/dashboard/AdminDashboard.jsx` | `POST /api/admin/create-hod`, `POST /api/admin/create-faculty` → `admin.controller` → `createApprovedUser` | User only | BROKEN | Both handlers create only an approved User. They do not create HODProfile/FacultyProfile or collect required profile/department data. The HOD profile endpoint is not an Admin endpoint, so this UI cannot complete provisioning. |
| Faculty and subject assignment | `client/src/pages/hod/FacultyManagementPage.jsx` (shared by Admin); `client/src/services/facultyService.js` | `GET /api/faculty`, `GET /api/subjects`, `GET /api/faculty/:id/subjects`, `POST /api/faculty/:id/assign-subject` | Yes, FacultyProfile, Subject, SubjectAssignment | NOT VERIFIED | A real listing and assignment path exists. No live operation was tested; remove-assignment exists in the API but is not exposed by this page. |
| Student fees and payments | `client/src/pages/dashboard/AdminStudentServices.jsx` | `/api/admin/fees/charges`, `/fees/students/:id`, `/fees/payments` | Schema models exist; live tables absent | BROKEN | Prisma migration status and read-only metadata check confirm the fee tables are not in the current database. Requests that query them fail until the pending migration is approved and applied. Payment entry records an administrative payment; it is not a payment processor. |
| Library inventory, loans, policy | `client/src/pages/dashboard/AdminStudentServices.jsx` | `/api/admin/library/books`, `/policy`, `/loans`, issue/return routes | Schema models exist; live tables absent | BROKEN | Required library tables are absent from the checked database. UI/API code is present but cannot currently persist these operations. |
| Student document review | `client/src/pages/dashboard/AdminStudentServices.jsx` | `/api/admin/documents`, `/api/admin/students/:studentId/documents`, `/documents/:id/review` | Schema model exists; live table absent | BROKEN | The page stores an HTTPS document reference and review status; it is not a file-upload/storage workflow. The table is absent until migration. |
| Notifications, profile editing, settings | `client/src/components/Navbar.jsx`; Admin routes in `AppRoutes.jsx` | No Admin notification/profile/settings API consumer found | No | STATIC / UI ONLY or NOT IMPLEMENTED | Navbar notification control has no functional notification workflow. Admin-specific profile/settings pages are not routed. Generic sidebar links use hash anchors not present in AdminDashboard. |

### HOD Portal

| Feature | Frontend File | API/Backend | Database Connected? | Status | Problem / Missing Work |
|---|---|---|---|---|---|
| Login, session, logout, HOD route gate | `client/src/pages/Login.jsx`; `client/src/routes/AppRoutes.jsx`; `client/src/routes/RoleRoute.jsx` | `/api/auth/login`, `/api/auth/me`; HOD router guard | Yes | NOT VERIFIED | Code enforces approved account and HOD role; no end-to-end role test was run. Dual Faculty/HOD role support is described in section F. |
| Pending faculty approvals | `client/src/pages/dashboard/HODDashboard.jsx` | `GET /api/hod/pending-faculty`; `PATCH /api/hod/faculty/:id/{approve,reject}` | Yes, User and ApprovalLog | BROKEN | The controller queries all PENDING FACULTY users and status updates accept any Faculty User ID; neither is scoped to the HOD’s department. |
| Create Coordinator | `client/src/pages/dashboard/HODDashboard.jsx` | `POST /api/hod/create-coordinator` | User and CoordinatorProfile | BROKEN | Form submits name/email/password only. Controller calls `employeeId.trim()` after creating the approved User, so it errors and leaves an orphan account. Creation is not transactional and trusts department fields in the request. |
| Department overview and counts | `client/src/pages/hod/DepartmentOverviewPage.jsx` | `GET /api/hod/dashboard` exists | Yes, HODProfile, Department, StudentProfile, FacultyProfile, Subject | STATIC / UI ONLY | The page is a placeholder and does not consume the available overview API. API itself requires an HODProfile linked to a department. |
| Faculty list / subject assignments | `client/src/pages/hod/FacultyManagementPage.jsx` | Shared page calls general `/api/faculty` and `/api/subjects` endpoints | Yes | NOT VERIFIED | Real code paths exist, but this HOD page uses general faculty listing rather than the department-scoped `/api/hod/faculty`; department boundaries are not applied by the general list route. |
| OP requests | `client/src/pages/hod/OPManagementPage.jsx` | No OP route/controller/model found | No | STATIC / UI ONLY | Requests, status tabs, and actions are placeholders. Sidebar query links do not make the placeholder page data-backed. |
| Access audit and login/data-access history | `client/src/pages/hod/AccessAuditLogPage.jsx` | No matching API/model found | No | STATIC / UI ONLY | View/export controls have no persistence or audit-log API. |
| Faculty attendance / leave overview | `client/src/pages/hod/FacultyAttendancePage.jsx` | No HOD faculty-attendance route found | No | STATIC / UI ONLY | The page is not connected to Faculty attendance sessions or leave data. |
| Reports and exports | `client/src/pages/hod/ReportsPage.jsx` | No matching HOD report/export endpoint found | No | STATIC / UI ONLY | Report tabs/export controls are visual placeholders. |
| Profile and settings | `client/src/pages/hod/HODProfilePage.jsx`; `client/src/pages/hod/HODSettingsPage.jsx` | Auth `/me` provides profile fields; no edit/settings APIs consumed | Partial read only | PARTIALLY FUNCTIONAL | Identity can come from auth context; fallback department/email values are fabricated or generic. Editing/settings are not persisted. |
| Navbar notifications/messages | `client/src/components/hod/HODNavbar.jsx` | No HOD notification/message API consumed | No | STATIC / UI ONLY | Unread count is initialized to 3; click actions show fixed toast text. |

### Coordinator Portal

| Feature | Frontend File | API/Backend | Database Connected? | Status | Problem / Missing Work |
|---|---|---|---|---|---|
| Login, session, logout, Coordinator route gate | `client/src/routes/AppRoutes.jsx`; `client/src/components/coordinator/CoordinatorSidebar.jsx` | Auth APIs; coordinator router guard | Yes | NOT VERIFIED | Approved Coordinator role is checked in backend middleware. No staff session test was performed. |
| Dashboard core counts | `client/src/pages/coordinator/CoordinatorDashboardPage.jsx` | `GET /api/coordinator/dashboard` | Yes, existing student/faculty/subject tables | NOT VERIFIED | Controller computes totals from Prisma. Code path was not exercised with an authenticated Coordinator. |
| Dashboard event and attendance stats | Same dashboard | `GET /api/coordinator/dashboard/portal-events` | New CampusEvent/registration tables absent | BROKEN | Endpoint queries tables missing from current Neon. Backend deliberately returns attendance rates as null; no attendance analytics are implemented. |
| Events list, calendar, create | `client/src/pages/coordinator/events/AllEventsPage.jsx`; `EventCalendarPage.jsx`; `CreateEventPage.jsx` | `GET /api/coordinator/events`, `GET /events/:id`, `POST /events` | New CampusEvent table absent | BROKEN | Code is API-backed, but required event tables are missing in the checked database. No edit/delete event routes exist. |
| Event participants and registration import | `client/src/pages/coordinator/participants/ParticipantsListPage.jsx`; `AddParticipantPage.jsx`; `ImportParticipantsPage.jsx` | `/api/coordinator/participants`, `/participants/bulk`, events routes | EventRegistration/CampusEvent tables absent | BROKEN | These flows register already-existing students for events; they do not create student identities. The required tables are missing. CSV import uses the local file to register student IDs. |
| Student batch allocation and individual adjustment | `client/src/pages/coordinator/participants/StudentBatchAllocationPage.jsx` | `GET /api/coordinator/student-batches`; `PATCH /student-batches/:id` | Yes, StudentProfile and applied labBatch column | NOT VERIFIED | Uses saved roll number/division and current labBatch; preview is computed in the page/API. Backend validates division-compatible batch, but update is scoped by profile ID and not Coordinator department. No save was performed. |
| Faculty list and event duty mapping | `client/src/pages/coordinator/faculty/FacultyListPage.jsx`; `FacultyMappingPage.jsx` | `GET /api/coordinator/faculty`; `GET /events`; `POST /faculty/mapping` | EventFacultyAssignment table absent | BROKEN | Mapping is event-duty assignment, not subject-to-faculty academic assignment. The current event-faculty table is missing in Neon. |
| Add Faculty | `client/src/pages/coordinator/faculty/AddFacultyPage.jsx` | No Coordinator create-faculty route; `/api/faculty` create is Admin/HOD only | No | STATIC / UI ONLY | Submit handler simulates success, shows a success toast, and navigates without an API request or saving a FacultyProfile. |
| Attendance mapping | `client/src/pages/coordinator/attendance/AttendanceMappingPage.jsx` | Reads event/faculty APIs; posts event-duty mapping | Event table absent; no attendance analytics | BROKEN | “Subject to Faculty Mapping” route renders the same event-duty mapper. `mapEvent` does not provide the attendance rate/department fields used by this page; progress defaults to 0 and the department filter cannot be trusted. |
| Reports and exports | `client/src/pages/coordinator/reports/ReportsPage.jsx` | `GET /api/coordinator/reports/events` | Event registration tables absent | BROKEN | Report counts depend on absent tables. Controller explicitly reports attendance analytics unavailable; export action is a toast saying export is unavailable. |
| Event eligibility rules | `client/src/pages/coordinator/eligibility/EligibilityPage.jsx` | Loads events; no save/enforcement endpoint | No rules persistence | STATIC / UI ONLY | Hardcoded eligibility thresholds and departments are saved only in component state with `setTimeout`; UI claims they are enforced, but event registration only checks the event’s target year/division/batch. |
| Profile and settings | `client/src/pages/coordinator/profile/CoordinatorProfilePage.jsx`; `CoordinatorSettingsPage.jsx` | No profile/settings API consumed | No | STATIC / UI ONLY | Profile defaults include sample identity/contact/department data and a simulated save. Settings persist only in local component state. |
| Navbar notifications/messages | `client/src/components/coordinator/CoordinatorNavbar.jsx` | No notification API consumed | No | STATIC / UI ONLY | Fixed unread count and toast actions. |

### Faculty Portal

| Feature | Frontend File | API/Backend | Database Connected? | Status | Problem / Missing Work |
|---|---|---|---|---|---|
| Login, session, logout, Faculty route gate | `client/src/pages/Login.jsx`; `client/src/routes/AppRoutes.jsx`; `FacultySidebar.jsx` | `/api/auth/login`, `/api/auth/me`; Faculty router and attendance router guards | Yes | NOT VERIFIED | Authentication logic is present but was not run with a Faculty account. Sidebar logout clears client auth; server logout/revocation route is absent. |
| Dashboard and summary statistics | `client/src/pages/dashboard/FacultyDashboard.jsx`; `server/src/controllers/faculty.controller.js` | `/api/faculty/dashboard`, `/today-classes`, `/schedule/today`, `/notifications`, `/attendance/summary` | Mixed | BROKEN | Dashboard controller hardcodes pending attendance, leave requests, upcoming events, fallback academic year. Attendance summary hardcodes 60 students, 54 present, 90%, classes × 12, and one pending submission. Today/schedule/notifications also rely on tables absent from Neon. |
| Take attendance, active session, roster, submit, complete | `client/src/pages/faculty/attendance/TakeAttendance.jsx` | `/api/attendance/faculty/assignments`, `/eligible-students`, `/students`, `/history`, `/sessions*` | Yes, existing AttendanceSession/AttendanceRecord | NOT VERIFIED | Full API path and lab-batch-aware server code exist. No live authenticated session was created or submitted in this audit. This is the real attendance system; no duplicate is indicated by source inspection. |
| Attendance history / class, batch, day reports | `client/src/pages/faculty/attendance/AttendanceHistory.jsx`; `TakeAttendance.jsx` | `GET /api/attendance/history` | Yes | NOT VERIFIED | Pages request real attendance history; no authenticated read test was performed. “Reports” route reuses AttendanceHistory. |
| Event attendance approval | `client/src/pages/faculty/attendance/EventAttendanceApproval.jsx`; `TakeAttendance.jsx` | Frontend calls `/api/faculty/attendance/event-approval...`; no such Faculty route is registered | No matching endpoint | BROKEN | Standalone page uses sample approvals and local approve/reject. Integrated TakeAttendance service calls target nonexistent routes and will fail. |
| Timetable and today’s schedule | `client/src/pages/faculty/schedule/MySchedule.jsx`; `TodaySchedule.jsx` | `/api/faculty/timetable`, `/schedule/today`, `/today-classes` | TimetableEntry model exists; table absent in Neon | BROKEN | Routes/controllers exist but the table is not present in the checked database until the pending migration is applied. |
| Assignments and submissions | `client/src/pages/faculty/assignments/AssignmentsPage.jsx` | `/api/faculty/assignments`, `/:id/submissions`, review routes | AcademicAssignment and AssignmentSubmission tables absent | BROKEN | Routes/controllers exist, but the backing tables are missing. Analytics and upload route behavior is not fully represented by separate endpoints; no delete route is registered. |
| Study plans | `client/src/pages/faculty/study-plan/StudyPlanPage.jsx` | `/api/faculty/study-plans`, publish route | StudyPlan table absent | BROKEN | API is wired, but the table is absent in current Neon. |
| Student leave review | `client/src/pages/faculty/leave/StudentLeaveRequests.jsx` | No Faculty leave review endpoint | Leave tables absent in current Neon | NOT IMPLEMENTED | Current page communicates that review authority/endpoint is not configured; faculty cannot review/approve/reject leave. |
| Faculty’s own leave requests | `client/src/pages/faculty/leave/MyLeave.jsx` | Service references `/api/faculty/leave/...`; no routes are registered | Leave tables absent | STATIC / UI ONLY | Sample leave rows and quotas are local. Submit shows success and changes local state without an API call. |
| Events | `client/src/pages/faculty/events/EventsPage.jsx` | Faculty event service URLs have no matching Faculty routes | No Faculty event backend | STATIC / UI ONLY | Initial events are hardcoded; create/edit/archive actions are local and show simulated success. Coordinator event APIs are not consumed by this Faculty page. |
| Campus announcements/class notices | `client/src/pages/faculty/campus/CampusPage.jsx` | Faculty campus service URLs have no matching routes | No | STATIC / UI ONLY | Sample announcements and pinned items; posting is local with a success toast. |
| Notifications | `client/src/components/faculty/FacultyNavbar.jsx`; faculty controller notifications endpoint | `GET /api/faculty/notifications` exists | StudentNotification table absent in Neon | BROKEN / PARTIALLY FUNCTIONAL | Endpoint queries a real model, but table is absent. Navbar bell is a fixed indicator without a notification list/read workflow. |
| Profile | `client/src/pages/faculty/profile/FacultyProfilePage.jsx` | `GET /api/faculty/me` | Yes, FacultyProfile | PARTIALLY FUNCTIONAL | Real profile read is wired; fallback values are used on request failure. No Faculty self-edit endpoint is consumed. |
| Settings and navbar search | `client/src/pages/faculty/settings/FacultySettingsPage.jsx`; `FacultyNavbar.jsx` | No settings/search API | No | STATIC / UI ONLY | Preferences are local and success toast is simulated. Search button has no action; notification bell has no working list. |
| Quick actions / route navigation | `client/src/pages/dashboard/FacultyDashboard.jsx`; `client/src/routes/AppRoutes.jsx` | Client routing | N/A | BROKEN | Dashboard links to `/dashboard/faculty/assignments/upload` and `/dashboard/faculty/campus/notifications`; neither route is registered. |

### Non-Teaching Staff Portal

| Feature | Frontend File | API/Backend | Database Connected? | Status | Problem / Missing Work |
|---|---|---|---|---|---|
| Non-teaching role, login portal, dashboard, permissions | `server/prisma/schema.prisma`; `client/src/routes/AppRoutes.jsx` | No role, route, controller, or profile found | No | NOT IMPLEMENTED | Prisma Role enum contains ADMIN, STUDENT, FACULTY, HOD, COORDINATOR only. No separate non-teaching portal exists. |

## C. Static Features Report

The following literals/actions were verified in source. Line numbers are approximate and refer to the current checkout.

| Static / simulated item | File and approximate lines | Effect |
|---|---|---|
| Demo account definitions and quick-login buttons | `client/src/pages/Login.jsx:~10-70` | Exposes demo-account UI and credentials in source; values intentionally omitted here. One button label describes a Student role as “Staff.” Do not use these as proof of real staff accounts. |
| Admin sidebar hash links | `client/src/components/Sidebar.jsx:~20-55, ~100-115`; `AdminDashboard.jsx` has no corresponding anchors | `#users`, `#create-hod`, `#create-faculty` do not select Admin tabs; generic anchor navigation is not connected to the tab state. |
| Admin navbar notification | `client/src/components/Navbar.jsx:~` | Bell control has no notification list or API action. |
| HOD notification count and fixed toast copy | `client/src/components/hod/HODNavbar.jsx:20, ~60-100` | Count starts at 3; notification/messages do not load from an API. |
| HOD department, OP, audit, faculty attendance, and reports placeholders | `client/src/pages/hod/DepartmentOverviewPage.jsx`; `OPManagementPage.jsx`; `AccessAuditLogPage.jsx`; `FacultyAttendancePage.jsx`; `ReportsPage.jsx` | Visual tables/cards/tabs and export actions do not consume backend APIs. |
| HOD profile fallbacks and static settings | `client/src/pages/hod/HODProfilePage.jsx`; `HODSettingsPage.jsx` | Generic/fallback profile values; no update endpoint. |
| Coordinator dashboard notification count | `client/src/components/coordinator/CoordinatorNavbar.jsx:20, ~65-95` | Fixed count of 2 and fixed message toasts. |
| Add Faculty fake submission | `client/src/pages/coordinator/faculty/AddFacultyPage.jsx:~15-45` | Local timeout/success toast/navigation; no network call. |
| Eligibility thresholds and fake save | `client/src/pages/coordinator/eligibility/EligibilityPage.jsx:~17-25, 60-70` | Hardcoded departments/years/attendance/CGPA criteria; local timeout claims rules are enforced. |
| Coordinator profile identity and simulated save | `client/src/pages/coordinator/profile/CoordinatorProfilePage.jsx:~18-45` | Default identity/contact/department/employee values and local success. |
| Coordinator settings toggles | `client/src/pages/coordinator/settings/CoordinatorSettingsPage.jsx:~13 onward` | Local component state only. |
| Attendance chart fallback values | `client/src/components/coordinator/AttendanceChart.jsx` | Defaults to fixed rates if used without props. Current dashboard usually suppresses the chart when API rates are null, but fallback remains. |
| Faculty dashboard fabricated counts | `server/src/controllers/faculty.controller.js:~375-405` | Static pending attendance, leave, event counts, and academic year fallback. |
| Faculty attendance summary fabricated figures | `server/src/controllers/faculty.controller.js:~500-545` | Static 60 total, 54 present, 90%, classes × 12, and pending-submission count. |
| Faculty event list and local create/edit/archive | `client/src/pages/faculty/events/EventsPage.jsx:23, 109, ~145-170` | Hardcoded INITIAL_EVENTS and simulated local actions. |
| Faculty campus announcements and local post | `client/src/pages/faculty/campus/CampusPage.jsx:21, 104, ~140-155` | Hardcoded announcement arrays; post action only updates local state and shows success. |
| Faculty event approvals | `client/src/pages/faculty/attendance/EventAttendanceApproval.jsx:6, 17, ~20-30` | Sample approvals; approve/reject affects only local state. |
| Faculty leave samples, quota, and fake submit | `client/src/pages/faculty/leave/MyLeave.jsx:8-23, ~35-50` | Local sample rows/quota; success message without persistence. |
| Faculty settings save | `client/src/pages/faculty/settings/FacultySettingsPage.jsx:7-13` | Toggles are local; “saved” toast does not call backend. |
| Faculty navbar search and bell | `client/src/components/faculty/FacultyNavbar.jsx` | Search does nothing; bell is a fixed visual dot. |

## D. Broken Features Report

1. **HOD profile endpoint can grant HOD role to another account — security critical.** `POST /api/hod/profile` is within a router guarded for HOD users, but the handler accepts `userId` from the request and creates an HODProfile without checking that the target is the caller or that the target has an approved HOD User role. `auth.middleware.js` derives the HOD role from the existence of HODProfile. An HOD can therefore create a profile for another existing account and cause it to receive HOD authorization on subsequent requests. Relevant files: `server/src/routes/hod.routes.js:30`; `server/src/controllers/hod.controller.js:81-109`; `server/src/middleware/auth.middleware.js:~64-80`.

2. **Admin HOD/Faculty creation leaves incomplete accounts.** `admin.controller.createHod/createFaculty` calls `createApprovedUser`, which inserts only User. Admin forms do not collect employee ID/department; no associated profile is created. Profile-dependent APIs return profile-not-found, and HOD department overview cannot resolve a department. Relevant files: `server/src/controllers/admin.controller.js:4-45`; `server/src/services/user.service.js:5-25`; `client/src/pages/dashboard/AdminDashboard.jsx`.

3. **HOD Create Coordinator fails after creating a User.** HOD form state contains name/email/password only (`HODDashboard.jsx`); backend accesses `employeeId.trim()` when creating CoordinatorProfile, after inserting User. This deterministically throws when the UI submits as written and leaves an approved COORDINATOR User without CoordinatorProfile. It also takes department fields from the request rather than deriving/validating the HOD’s own department. Relevant files: `client/src/pages/dashboard/HODDashboard.jsx:~100-145`; `server/src/controllers/hod.controller.js:114-156`.

4. **HOD faculty approval is not department-scoped.** Both the pending list and approval/rejection use global FACULTY User records. The separate `/api/hod/faculty` endpoint is department-scoped, but the HOD dashboard does not use it for pending approvals. Relevant files: `server/src/controllers/hod.controller.js:~168-225`; `server/src/services/user.service.js:~50-95`.

5. **Portal tables are missing in current Neon.** `migrate status` reports `20261023143000_add_student_portal_features` pending; read-only metadata query found no tables for TimetableEntry, AcademicAssignment/Submission, StudyPlan, LeaveRequest/Review, CampusEvent/Registration/FacultyAssignment, StudentNotification, StudentDocument, StudentFeeCharge/Payment, or LibraryBook/Loan/Policy. Calls to these new-model APIs cannot succeed against the checked database until the migration is approved/applied. No migration was executed.

6. **Faculty event-approval client targets absent routes.** `facultyService.js` calls `/api/faculty/attendance/event-approval...`; `faculty.routes.js` registers no such route. The standalone page is mock-only, while TakeAttendance’s integrated calls will receive route-not-found responses.

7. **Faculty Events, Campus, and leave APIs are not implemented for Faculty.** The service layer contains URLs for these features, but Faculty route registration has no corresponding handlers. Visible Events/Campus/MyLeave pages bypass the service and report simulated local success instead.

8. **Coordinator subject-mapping screen maps event duty.** Both subject and event mapping routes render AttendanceMappingPage; the only backend mapping endpoint creates EventFacultyAssignment. It does not create a SubjectAssignment or attendance mapping. The event projection lacks fields the page uses for department and attendance progress.

9. **Coordinator eligibility success is false.** The rules page saves locally and says criteria are “saved and enforced,” while server event registration checks only event target academic year/student year/division/lab batch; it does not enforce the displayed attendance, CGPA, or department criteria.

10. **Faculty dashboard attendance figures are not derived from attendance records.** The controller returns fixed figures instead of querying AttendanceSession/AttendanceRecord. These values are misleading even if the request itself succeeds.

11. **Faculty dashboard quick actions have dead routes.** `/dashboard/faculty/assignments/upload` and `/dashboard/faculty/campus/notifications` are linked but absent from `AppRoutes.jsx`.

12. **HOD sidebar advertises pages/actions that are not implemented.** OP, audit/export, faculty attendance, and reports render placeholder pages; query-string variants do not have backing services.

## E. Backend API Coverage

### Authentication and shared role checks

| Endpoint group | Frontend consumer | Backend / data | Coverage |
|---|---|---|---|
| `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/register-faculty`, password change, role-check endpoints | `Login.jsx`, AuthContext, `authService.js` | `auth.routes.js` → `auth.controller.js` → Prisma User and role profile includes | Connected in code; not exercised end to end. There is no server logout endpoint. |
| Admin routes | AdminDashboard and AdminStudentServices | `admin.routes.js` → `admin.controller.js` / `studentPortalManagement.controller.js` | User endpoints use existing tables. Fees/library/document routes depend on absent pending-migration tables. |
| HOD routes | HODDashboard; several page routes do not consume them | `hod.routes.js` → `hod.controller.js` | `/dashboard`, `/faculty`, `/pending-faculty`, approvals, create Coordinator, profile, approval history. Department overview and history APIs are not consumed by current HOD pages. |
| Coordinator routes | CoordinatorDashboard, Events, Participants, Faculty, Batch, Reports pages | `coordinator.routes.js` → coordinator and portal management controllers | Most event/participant/duty endpoints are called, but depend on absent tables. Pending-student approval/history endpoints have no current consumer found. Batch endpoints use StudentProfile. |
| Faculty self-service routes | Faculty dashboard/profile/schedule/assignments/study plan pages | `faculty.routes.js` → faculty and portal management controllers | `/me`, dashboard, schedule, notifications, summary, timetable, assignments, study plans are registered. Several require absent portal tables; summary contains hardcoded data. |
| Faculty attendance routes | TakeAttendance and AttendanceHistory | `attendance.routes.js` → `attendance.controller.js` → AttendanceSession/AttendanceRecord | Route coverage exists for assignments, roster, active session, history, session start, record save and completion. No runtime Faculty attendance workflow was executed. |

### Shared and unconsumed endpoints

- `GET /api/faculty`, `GET /api/faculty/:id`, `GET /api/faculty/:id/subjects`, `POST /api/faculty/:id/assign-subject` feed shared Admin/HOD faculty management. The general list is not department-scoped for HOD callers.
- `POST /api/faculty` and `PUT /api/faculty/:id` are Admin/HOD only; Coordinator AddFaculty does not consume them and is not authorized to use them.
- `/api/departments` and `/api/subjects` provide existing shared read/management paths. Student import routes are separate and are not equivalent to Coordinator event-participant CSV import.
- `/api/hod/dashboard`, `/api/hod/faculty`, `/api/hod/approval-history`, and `/api/hod/profile` have no current page consumer identified. The profile endpoint remains callable by HOD due router guards.
- `/api/coordinator/pending-students`, student approve/reject, and approval-history endpoints have no consumer in the Coordinator UI. The Participants page is an event registration roster, not a student master-management directory.
- No matching Faculty endpoints were found for `/api/faculty/events*`, `/api/faculty/campus*`, `/api/faculty/leave*`, or `/api/faculty/attendance/event-approval*`, although related client service functions exist.
- Additional Faculty service URLs for weekly/upcoming/summary/export schedule and assignment analytics/detail/delete/recent submissions are not all represented in `faculty.routes.js`. Existing list/create/update/submission/review routes are present; callers for each helper were not found for all extras.

## F. RBAC and Security Findings

### Controls present in code

- Admin, HOD, and Coordinator routers apply `authenticate`, `requireApproved`, and a role guard at router level.
- Attendance routes apply `authenticate`, `requireApproved`, and `authorize("FACULTY")` to the full router.
- Auth middleware loads the active/status/tokenVersion state from User. Deactivated accounts are rejected; `requireApproved` rejects non-approved users.
- Student, faculty, admin, HOD, and Coordinator route guards are also present in the React route tree. Frontend guards complement but do not replace backend authorization.
- `sanitizeUser` and `auth.middleware` add both HOD and FACULTY roles when their respective profiles exist. This supports a dual-role account such as Vidya’s. The project’s role tabs/redirects use role arrays. This was verified by code inspection, not an account login test.
- Attendance controller code checks faculty subject assignment; student-facing check-in authorization is outside this staff-only audit’s functional verification.

### Confirmed or likely permission issues

- **Critical:** HOD-only `POST /api/hod/profile` can create a profile for arbitrary `userId`. Middleware derives HOD role from that profile, enabling privilege escalation.
- **High:** HOD pending-faculty list and approval actions are global; there is no HOD department ownership check on target faculty. The shared `/api/faculty` listing used by HOD management is also not department-scoped.
- **High:** HOD create-Coordinator accepts department fields from the request rather than enforcing the caller’s department; the current UI omits required employee/department fields and causes partial account creation.
- **Medium:** Coordinator batch list/update are role-gated but no Coordinator department ownership scope is applied; update accepts any StudentProfile ID and only validates the batch against that student’s division. Confirm intended Coordinator scope before tightening this.
- **Medium:** HOD created by Admin has no HODProfile, while profile provisioning is not available to Admin; permissions and account creation workflow are inconsistent.
- **Session:** no server logout route revokes a token. Client logout removes local credentials; server still accepts a copied token until it expires or tokenVersion changes. User deactivation is checked on requests.
- No evidence found that direct URL access bypasses backend guards for the guarded routers; no adversarial HTTP test was run.

## G. Remaining Development Work

### P0 — Critical blockers

1. Restrict HOD profile creation so a caller cannot attach HODProfile to arbitrary accounts; validate target role and department, and make intended Admin provisioning available only to authorized Admins.
2. Scope HOD pending-faculty discovery and approve/reject actions to the HOD’s department; audit the shared HOD faculty-management list/assignment API for the same boundary.
3. Make staff account and profile creation atomic and require profile fields at creation. Fix HOD Coordinator form/controller contract so a failed request cannot leave an approved orphan User.
4. Stop reporting fake faculty attendance/dashboard metrics; calculate from actual attendance sessions and records or show an unavailable state.

### P1 — Essential for a project demonstration

1. Review and apply the pending student-portal migration through the project’s normal approval process; then smoke-test coordinator events, participants, faculty schedule, assignments, study plans, Admin student services, and notifications against the real database.
2. Implement or remove Faculty event approval UI/service calls and the Faculty Events/Campus/leave fake-success paths.
3. Implement HOD department overview, faculty attendance, audit, OP, and reports APIs/pages or relabel/remove nonfunctional navigation.
4. Make Coordinator eligibility rules either persistent and server-enforced or remove the false “enforced” claim; implement true subject-to-faculty mapping or rename the event-duty mapper.
5. Add working notification and logout behavior, or remove controls that imply these features are active.

### P2 — Important but non-blocking

1. Add event editing/deletion and attendance analytics/export for Coordinator, with permission checks and migration-backed tests.
2. Add actual profile editing/settings persistence for Admin, HOD, Coordinator, and Faculty where required.
3. Add search, sorting, pagination, and error/empty states consistently to staff tables.
4. Replace dead Faculty dashboard routes and reconcile route labels/default tabs with rendered behavior.

### P3 — Optional improvements

1. Remove hardcoded demo credentials from the login page or move demo access to a local-only, nonproduction fixture workflow.
2. Add audit logging for Admin approvals/deactivation and staff administrative changes.
3. Add documented API contract tests and role/department boundary regression tests.

## H. Recommended Implementation Plan

1. **Secure provisioning first:** close the HOD profile escalation path; implement transactional User+profile creation; scope HOD operations by department; enforce Coordinator ownership rules. Add tests for cross-role and cross-department requests.
2. **Resolve database readiness through approval:** review the existing pending migration SQL and deploy it only after the database owner approves. Do not use `db push` as a substitute. Verify migration status and table presence read-only after deployment.
3. **Smoke-test connected core workflows:** Admin user review and provisioning, HOD approvals, Coordinator event registration and batch management, Faculty attendance/session history, timetable, and assignment submission/review. Use test accounts and record results without exposing credentials.
4. **Remove false data and success:** replace all fabricated dashboard values with database-derived values or explicit unavailable states; ensure every mutating button awaits a real API and reports its actual result.
5. **Complete staff modules by reusing existing domain records:** extend the current attendance/session model for faculty reports; reuse existing event and subject assignment models; build HOD reports/audit only after defining audit/event data ownership; persist settings only where product requirements need them.
6. **Finish route/navigation and regression coverage:** remove dead links, align tab query parameters with page state, and add backend RBAC, account-provisioning, migration-dependent integration, and error-path tests.

## I. Testing Evidence

### Verified by code inspection

- Staff frontend routes, role layouts/sidebars, services, Express mount points, role middleware, controllers, Prisma models/relations, and the relevant migration directory were traced.
- The account creation, HOD approval scope, HOD profile role derivation, Coordinator fake-success page, Faculty static pages, and missing Faculty routes described above are confirmed from source.
- Current Prisma Role enum contains ADMIN, STUDENT, FACULTY, HOD, COORDINATOR; no non-teaching role exists.

### Commands / read-only checks actually run

- `prisma validate --schema prisma/schema.prisma` — passed; Prisma schema is valid.
- `prisma migrate status --schema prisma/schema.prisma` — connected read-only status check succeeded: 9 migrations found; `20261023143000_add_student_portal_features` is pending.
- Read-only `information_schema` query against the configured Neon database — the queried new portal tables were absent. No row data was modified or enumerated.

### Not verified at runtime

- No Admin/HOD/Coordinator/Faculty login or authenticated API action was executed.
- No account creation, approval, batch update, attendance session, event registration, library, fee, document review, profile save, or export was submitted.
- No frontend build, browser test, backend startup, or automated feature test was run as part of this audit. Therefore API-backed features without a confirmed missing route/table are marked NOT VERIFIED rather than FUNCTIONAL.
- The pending migration was not applied. Runtime behavior after applying it remains unverified.

### Data safety

This audit used source inspection and read-only database checks. It made no Neon writes, ran no migration/seed, and changed no existing application or mobile file. The only intended workspace addition for this task is this Markdown report.
