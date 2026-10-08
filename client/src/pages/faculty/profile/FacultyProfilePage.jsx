import useAuth from '../../../hooks/useAuth';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import { UserCircleIcon, EnvelopeIcon, IdentificationIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const FacultyProfilePage = () => {
  const { user } = useAuth();

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
            {user?.name?.charAt(0)?.toUpperCase() || 'F'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Prof. {user?.name || 'Faculty Member'}</h2>
            <p className="text-xs text-blue-700 font-medium">{user?.designation || 'Assistant Professor'}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.department || 'Department of Computer Science'}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <div className="flex items-center gap-3 text-slate-700">
            <IdentificationIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Employee ID</p>
              <p className="text-slate-500">{user?.employeeId || 'EMP-2024-892'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Email Address</p>
              <p className="text-slate-500">{user?.email || 'faculty@college.edu'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Assigned Department</p>
              <p className="text-slate-500">{user?.department || 'Computer Science & Engineering'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <UserCircleIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Role &amp; Permissions</p>
              <p className="text-slate-500 font-mono">FACULTY (RBAC Verified)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
