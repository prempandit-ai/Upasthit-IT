import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, EnvelopeIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const FacultyProfileCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'F';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Faculty Profile</h2>

      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-2xl font-bold text-white">
          {initial}
        </div>
        <p className="mt-3 text-base font-bold text-slate-900">Prof. {user?.name ?? '—'}</p>
        {(user?.department || user?.profile?.departmentName) && (
          <p className="mt-0.5 text-xs text-slate-500">
            {user?.department || user?.profile?.departmentName}
          </p>
        )}
        {(user?.designation || user?.profile?.designation) && (
          <p className="mt-0.5 text-xs font-medium text-blue-700">
            {user?.designation || user?.profile?.designation}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2">
        {(user?.employeeId || user?.profile?.employeeId) && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <IdentificationIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>ID: {user?.employeeId || user?.profile?.employeeId}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{user?.email ?? '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserCircleIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>Faculty</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard/faculty/profile')}
        className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        View Profile
      </button>
    </div>
  );
};

export default FacultyProfileCard;
