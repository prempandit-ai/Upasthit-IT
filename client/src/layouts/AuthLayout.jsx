import { Outlet } from "react-router-dom";
import {
  AcademicCapIcon as AcademicCapSolid,
} from "@heroicons/react/24/solid";
import {
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* Left Column - Hero Brand & Features */}
      <div className="relative flex flex-1 flex-col justify-between bg-auth-pattern p-8 sm:p-12 lg:p-14 text-white overflow-hidden">
        {/* Top Branding */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <AcademicCapSolid className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white uppercase leading-none">
              DMCE IT
            </h2>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-cyan-300 uppercase mt-1">
              UPASTHIT ERP
            </p>
          </div>
        </div>

        {/* Center Content */}
        <div className="my-auto py-10 lg:py-8 max-w-xl z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-[1.15] tracking-tight">
            Unified Academic
            <br />
            Operations Platform
          </h1>
          <p className="mt-4 text-sm sm:text-base text-blue-100/80 leading-relaxed max-w-lg">
            One platform for Admin, HOD, Coordinator, Teachers, Non-Teaching Staff — with a dedicated mobile app for Students.
          </p>

          {/* 3 Translucent Feature Cards */}
          <div className="mt-8 space-y-3.5 max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition hover:bg-white/[0.09] hover:border-white/20">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-blue-300 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  6 Role-Based Dashboards
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-1 pl-8">
                Admin · HOD · Coordinator · Teacher · Staff · Student
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition hover:bg-white/[0.09] hover:border-white/20">
              <div className="flex items-center gap-3">
                <BookOpenIcon className="h-5 w-5 text-blue-300 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  Complete Academic Suite
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-1 pl-8">
                Attendance · Timetable · Assignments · Exams · Notices
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition hover:bg-white/[0.09] hover:border-white/20">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-5 w-5 text-blue-300 shrink-0" />
                <span className="text-sm font-semibold text-white">
                  Real-time Analytics
                </span>
              </div>
              <p className="text-xs text-blue-200/70 mt-1 pl-8">
                Attendance reports · Department insights · AI assistant
              </p>
            </div>
          </div>
        </div>

        {/* Decorative corner ambient light */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
      </div>

      {/* Right Column - Form Area */}
      <div className="flex w-full lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-center bg-white px-6 py-10 sm:px-12 lg:px-14">
        <div className="w-full max-w-sm mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;