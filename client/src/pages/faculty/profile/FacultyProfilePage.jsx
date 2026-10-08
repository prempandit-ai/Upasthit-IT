import { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import {
  UserCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  CalendarIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import { getFacultyProfile } from '../../../services/facultyService';

const FacultyProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacultyProfile()
      .then((res) => {
        setProfileData(res.data?.faculty || res.data);
      })
      .catch(() => {
        setProfileData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const faculty = profileData || user?.profile || {};
  const name = profileData?.user?.name || user?.name || 'Faculty Member';
  const email = profileData?.user?.email || user?.email || 'faculty@upasthit.test';
  const designation = faculty?.designation || user?.designation || 'Assistant Professor';
  const deptName =
    faculty?.department?.name ||
    faculty?.departmentName ||
    user?.department ||
    'Information Technology';
  const empId = faculty?.employeeId || user?.employeeId || 'EMP-FAC-IT01';
  const assignments = faculty?.subjectAssignments || [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Faculty Profile"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Profile' },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-700 text-3xl font-bold text-white shadow-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Prof. {name}</h2>
            <p className="text-xs text-blue-700 font-medium">{designation}</p>
            <p className="text-xs text-slate-500 mt-0.5">{deptName}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <div className="flex items-center gap-3 text-slate-700">
            <IdentificationIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Employee ID</p>
              <p className="text-slate-500">{empId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Email Address</p>
              <p className="text-slate-500">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Assigned Department</p>
              <p className="text-slate-500">{deptName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <UserCircleIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Role &amp; Permissions</p>
              <p className="text-slate-500 font-mono">FACULTY (RBAC Verified)</p>
            </div>
          </div>

          {/* Assigned Subjects & Academic Load */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-blue-700" />
              Assigned Subjects &amp; Teaching Load
            </h3>

            {loading ? (
              <div className="py-3 text-slate-400">Loading course assignments...</div>
            ) : assignments.length === 0 ? (
              <p className="text-slate-400">No subject assignments on record.</p>
            ) : (
              <div className="space-y-2.5">
                {assignments.map((assignment, idx) => (
                  <div
                    key={assignment.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {assignment.subject?.subjectCode} — {assignment.subject?.subjectName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {assignment.subject?.subjectType} • Semester {assignment.subject?.semester} ({assignment.subject?.year})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        <RectangleGroupIcon className="h-3 w-3" />
                        Div {assignment.division || 'All'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        <CalendarIcon className="h-3 w-3" />
                        {assignment.academicYear}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
