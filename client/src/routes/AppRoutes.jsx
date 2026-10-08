import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import FacultyLayout from "../layouts/FacultyLayout";
import HODLayout from "../layouts/HODLayout";
import CoordinatorLayout from "../layouts/CoordinatorLayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import RegisterFaculty from "../pages/RegisterFaculty";
import Unauthorized from "../pages/Unauthorized";
import NotFound from "../pages/NotFound";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import StudentDashboard from "../pages/dashboard/StudentDashboard";
import FacultyDashboard from "../pages/dashboard/FacultyDashboard";
import HODDashboard from "../pages/dashboard/HODDashboard";

// Coordinator Portal Module Pages
import CoordinatorDashboardPage from "../pages/coordinator/CoordinatorDashboardPage";
import CreateEventPage from "../pages/coordinator/events/CreateEventPage";
import AllEventsPage from "../pages/coordinator/events/AllEventsPage";
import EventCalendarPage from "../pages/coordinator/events/EventCalendarPage";
import ParticipantsListPage from "../pages/coordinator/participants/ParticipantsListPage";
import AddParticipantPage from "../pages/coordinator/participants/AddParticipantPage";
import ImportParticipantsPage from "../pages/coordinator/participants/ImportParticipantsPage";
import FacultyListPage from "../pages/coordinator/faculty/FacultyListPage";
import AddFacultyPage from "../pages/coordinator/faculty/AddFacultyPage";
import FacultyMappingPage from "../pages/coordinator/faculty/FacultyMappingPage";
import AttendanceMappingPage from "../pages/coordinator/attendance/AttendanceMappingPage";
import CoordinatorReportsPage from "../pages/coordinator/reports/ReportsPage";
import EligibilityPage from "../pages/coordinator/eligibility/EligibilityPage";
import CoordinatorProfilePage from "../pages/coordinator/profile/CoordinatorProfilePage";
import CoordinatorSettingsPage from "../pages/coordinator/settings/CoordinatorSettingsPage";

// HOD Portal Module Pages
import DepartmentOverviewPage from "../pages/hod/DepartmentOverviewPage";
import OPManagementPage from "../pages/hod/OPManagementPage";
import FacultyManagementPage from "../pages/hod/FacultyManagementPage";
import AccessAuditLogPage from "../pages/hod/AccessAuditLogPage";
import FacultyAttendancePage from "../pages/hod/FacultyAttendancePage";
import ReportsPage from "../pages/hod/ReportsPage";
import HODProfilePage from "../pages/hod/HODProfilePage";
import HODSettingsPage from "../pages/hod/HODSettingsPage";

// Faculty Portal Module Pages
import TakeAttendance from "../pages/faculty/attendance/TakeAttendance";
import AttendanceHistory from "../pages/faculty/attendance/AttendanceHistory";
import EventAttendanceApproval from "../pages/faculty/attendance/EventAttendanceApproval";
import StudentLeaveRequests from "../pages/faculty/leave/StudentLeaveRequests";
import MyLeave from "../pages/faculty/leave/MyLeave";
import MySchedule from "../pages/faculty/schedule/MySchedule";
import TodaySchedule from "../pages/faculty/schedule/TodaySchedule";
import AssignmentsPage from "../pages/faculty/assignments/AssignmentsPage";
import EventsPage from "../pages/faculty/events/EventsPage";
import CampusPage from "../pages/faculty/campus/CampusPage";
import StudyPlanPage from "../pages/faculty/studyPlan/StudyPlanPage";
import FacultyProfilePage from "../pages/faculty/profile/FacultyProfilePage";
import FacultySettingsPage from "../pages/faculty/settings/FacultySettingsPage";

import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const RoleRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Redirecting..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPathForRole(user.role)} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public auth pages ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/faculty" element={<RegisterFaculty />} />
      </Route>

      {/* ── Protected routes ── */}
      <Route element={<PrivateRoute />}>
        {/* Faculty Layout with specialized sidebar & navbar */}
        <Route element={<FacultyLayout />}>
          <Route element={<RoleRoute allowedRoles={["FACULTY"]} />}>
            <Route path="/dashboard/faculty" element={<FacultyDashboard />} />

            {/* 1. Attendance Module */}
            <Route path="/dashboard/faculty/attendance/take" element={<TakeAttendance />} />
            <Route path="/dashboard/faculty/attendance/history" element={<AttendanceHistory />} />
            <Route path="/dashboard/faculty/attendance/class-wise" element={<AttendanceHistory defaultTab="class" />} />
            <Route path="/dashboard/faculty/attendance/batch-wise" element={<AttendanceHistory defaultTab="batch" />} />
            <Route path="/dashboard/faculty/attendance/day-wise" element={<AttendanceHistory defaultTab="day" />} />
            <Route path="/dashboard/faculty/attendance/event-approval" element={<EventAttendanceApproval />} />

            {/* 2. Leave Management Module */}
            <Route path="/dashboard/faculty/leave" element={<StudentLeaveRequests />} />
            <Route path="/dashboard/faculty/leave/student-requests" element={<StudentLeaveRequests />} />
            <Route path="/dashboard/faculty/leave/my-leave" element={<MyLeave />} />

            {/* 3. Schedule / Timetable Module */}
            <Route path="/dashboard/faculty/schedule" element={<MySchedule />} />
            <Route path="/dashboard/faculty/schedule/manage" element={<MySchedule />} />
            <Route path="/dashboard/faculty/schedule/today" element={<TodaySchedule />} />

            {/* 4. Assignments Module */}
            <Route path="/dashboard/faculty/assignments" element={<AssignmentsPage />} />
            <Route path="/dashboard/faculty/assignments/manage" element={<AssignmentsPage />} />
            <Route path="/dashboard/faculty/assignments/submissions" element={<AssignmentsPage defaultTab="submissions" />} />
            <Route path="/dashboard/faculty/assignments/analytics" element={<AssignmentsPage defaultTab="analytics" />} />

            {/* 5. Events Module */}
            <Route path="/dashboard/faculty/events" element={<EventsPage />} />
            <Route path="/dashboard/faculty/events/create" element={<EventsPage defaultAction="create" />} />
            <Route path="/dashboard/faculty/events/requests" element={<EventsPage defaultTab="requests" />} />
            <Route path="/dashboard/faculty/events/participants" element={<EventsPage defaultTab="participants" />} />
            <Route path="/dashboard/faculty/events/attendance" element={<EventsPage defaultTab="attendance" />} />

            {/* 6. Campus / Announcements Module */}
            <Route path="/dashboard/faculty/campus" element={<CampusPage />} />
            <Route path="/dashboard/faculty/campus/announcements" element={<CampusPage defaultTab="general" />} />
            <Route path="/dashboard/faculty/campus/class-notifications" element={<CampusPage defaultTab="class" />} />
            <Route path="/dashboard/faculty/campus/custom-announcements" element={<CampusPage defaultTab="custom" />} />
            <Route path="/dashboard/faculty/campus/department-notices" element={<CampusPage defaultTab="department" />} />

            {/* 7. Study Plan, Reports, Profile, Settings */}
            <Route path="/dashboard/faculty/study-plan" element={<StudyPlanPage />} />
            <Route path="/dashboard/faculty/study-plan/upload" element={<StudyPlanPage />} />
            <Route path="/dashboard/faculty/study-plan/history" element={<StudyPlanPage />} />
            <Route path="/dashboard/faculty/reports" element={<AttendanceHistory />} />
            <Route path="/dashboard/faculty/profile" element={<FacultyProfilePage />} />
            <Route path="/dashboard/faculty/settings" element={<FacultySettingsPage />} />

            {/* Optional /faculty/* redirects to keep URLs flexible */}
            <Route path="/faculty/dashboard" element={<Navigate to="/dashboard/faculty" replace />} />
            <Route path="/faculty/attendance/*" element={<Navigate to="/dashboard/faculty/attendance/take" replace />} />
            <Route path="/faculty/leave/*" element={<Navigate to="/dashboard/faculty/leave/student-requests" replace />} />
            <Route path="/faculty/schedule/*" element={<Navigate to="/dashboard/faculty/schedule/manage" replace />} />
            <Route path="/faculty/assignments/*" element={<Navigate to="/dashboard/faculty/assignments" replace />} />
            <Route path="/faculty/events/*" element={<Navigate to="/dashboard/faculty/events" replace />} />
            <Route path="/faculty/campus/*" element={<Navigate to="/dashboard/faculty/campus/announcements" replace />} />
          </Route>
        </Route>

        {/* HOD Layout with specialized sidebar & navbar */}
        <Route element={<HODLayout />}>
          <Route element={<RoleRoute allowedRoles={["HOD"]} />}>
            <Route path="/dashboard/hod" element={<HODDashboard />} />
            <Route path="/dashboard/hod/department" element={<DepartmentOverviewPage />} />
            <Route path="/dashboard/hod/department/program/:id" element={<DepartmentOverviewPage />} />
            <Route path="/dashboard/hod/op" element={<OPManagementPage />} />
            <Route path="/dashboard/hod/op/:requestId" element={<OPManagementPage />} />
            <Route path="/dashboard/hod/faculty" element={<FacultyManagementPage />} />
            <Route path="/dashboard/hod/faculty/:facultyId" element={<FacultyManagementPage />} />
            <Route path="/dashboard/hod/audit" element={<AccessAuditLogPage />} />
            <Route path="/dashboard/hod/audit/login-history" element={<AccessAuditLogPage />} />
            <Route path="/dashboard/hod/audit/data-access" element={<AccessAuditLogPage />} />
            <Route path="/dashboard/hod/faculty-attendance" element={<FacultyAttendancePage />} />
            <Route path="/dashboard/hod/reports" element={<ReportsPage />} />
            <Route path="/dashboard/hod/reports/:category" element={<ReportsPage />} />
            <Route path="/dashboard/hod/profile" element={<HODProfilePage />} />
            <Route path="/dashboard/hod/settings" element={<HODSettingsPage />} />

            {/* URL aliases for /hod/* routes */}
            <Route path="/hod" element={<Navigate to="/dashboard/hod" replace />} />
            <Route path="/hod/dashboard" element={<Navigate to="/dashboard/hod" replace />} />
            <Route path="/hod/department/*" element={<Navigate to="/dashboard/hod/department" replace />} />
            <Route path="/hod/op/*" element={<Navigate to="/dashboard/hod/op" replace />} />
            <Route path="/hod/faculty/*" element={<Navigate to="/dashboard/hod/faculty" replace />} />
            <Route path="/hod/audit/*" element={<Navigate to="/dashboard/hod/audit" replace />} />
            <Route path="/hod/faculty-attendance/*" element={<Navigate to="/dashboard/hod/faculty-attendance" replace />} />
            <Route path="/hod/reports/*" element={<Navigate to="/dashboard/hod/reports" replace />} />
            <Route path="/hod/profile" element={<Navigate to="/dashboard/hod/profile" replace />} />
            <Route path="/hod/settings" element={<Navigate to="/dashboard/hod/settings" replace />} />
          </Route>
        </Route>

        {/* Coordinator Layout with specialized sidebar & navbar */}
        <Route element={<CoordinatorLayout />}>
          <Route element={<RoleRoute allowedRoles={["COORDINATOR"]} />}>
            <Route path="/dashboard/coordinator" element={<CoordinatorDashboardPage />} />
            
            {/* Events */}
            <Route path="/dashboard/coordinator/events" element={<AllEventsPage />} />
            <Route path="/dashboard/coordinator/events/create" element={<CreateEventPage />} />
            <Route path="/dashboard/coordinator/events/calendar" element={<EventCalendarPage />} />

            {/* Participants */}
            <Route path="/dashboard/coordinator/participants" element={<ParticipantsListPage />} />
            <Route path="/dashboard/coordinator/participants/add" element={<AddParticipantPage />} />
            <Route path="/dashboard/coordinator/participants/import" element={<ImportParticipantsPage />} />

            {/* Faculty Management */}
            <Route path="/dashboard/coordinator/faculty" element={<FacultyListPage />} />
            <Route path="/dashboard/coordinator/faculty/add" element={<AddFacultyPage />} />
            <Route path="/dashboard/coordinator/faculty/mapping" element={<FacultyMappingPage />} />

            {/* Attendance Mapping */}
            <Route path="/dashboard/coordinator/attendance-mapping" element={<AttendanceMappingPage />} />
            <Route path="/dashboard/coordinator/attendance-mapping/subject" element={<AttendanceMappingPage />} />
            <Route path="/dashboard/coordinator/attendance-mapping/event" element={<AttendanceMappingPage />} />

            {/* Reports, Eligibility, Profile, Settings */}
            <Route path="/dashboard/coordinator/reports" element={<CoordinatorReportsPage />} />
            <Route path="/dashboard/coordinator/eligibility" element={<EligibilityPage />} />
            <Route path="/dashboard/coordinator/profile" element={<CoordinatorProfilePage />} />
            <Route path="/dashboard/coordinator/settings" element={<CoordinatorSettingsPage />} />

            {/* URL aliases for /coordinator/* */}
            <Route path="/coordinator" element={<Navigate to="/dashboard/coordinator" replace />} />
            <Route path="/coordinator/dashboard" element={<Navigate to="/dashboard/coordinator" replace />} />
            <Route path="/coordinator/events/*" element={<Navigate to="/dashboard/coordinator/events" replace />} />
            <Route path="/coordinator/participants/*" element={<Navigate to="/dashboard/coordinator/participants" replace />} />
            <Route path="/coordinator/faculty/*" element={<Navigate to="/dashboard/coordinator/faculty" replace />} />
            <Route path="/coordinator/attendance-mapping/*" element={<Navigate to="/dashboard/coordinator/attendance-mapping" replace />} />
            <Route path="/coordinator/reports/*" element={<Navigate to="/dashboard/coordinator/reports" replace />} />
            <Route path="/coordinator/profile" element={<Navigate to="/dashboard/coordinator/profile" replace />} />
            <Route path="/coordinator/settings" element={<Navigate to="/dashboard/coordinator/settings" replace />} />
          </Route>
        </Route>

        {/* All other roles use DashboardLayout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<RoleRedirect />} />

          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={["STUDENT"]} />}>
            <Route path="/dashboard/student" element={<StudentDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
