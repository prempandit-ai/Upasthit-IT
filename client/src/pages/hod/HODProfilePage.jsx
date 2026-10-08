import React from 'react';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/shared/PageHeader';
import { UserCircleIcon, EnvelopeIcon, IdentificationIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const HODProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="HOD Profile"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'Profile' },
        ]}
      />

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white shadow-xs">
            {user?.name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name || 'Head of Department'}</h2>
            <p className="text-xs font-semibold text-blue-700">Head of Department</p>
            <p className="mt-0.5 text-xs text-slate-500">Computer Engineering Department</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-xs">
          <div className="flex items-center gap-3 text-slate-700">
            <IdentificationIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Employee ID</p>
              <p className="text-slate-500 font-mono">HOD-CSE-001</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <EnvelopeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Email Address</p>
              <p className="text-slate-500">{user?.email || 'hod@upasthit.test'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">Department</p>
              <p className="text-slate-500">Computer Engineering</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <UserCircleIcon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-900">System Role</p>
              <p className="text-slate-500 font-mono">HOD (Department Administrator)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HODProfilePage;
