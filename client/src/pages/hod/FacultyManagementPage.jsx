import React from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';

const FacultyManagementPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Management"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'Faculty Management', href: '/dashboard/hod/faculty' },
          { label: 'Faculty List' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <ArrowUpTrayIcon className="h-4 w-4 text-slate-500" />
              Import Faculty
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <PlusIcon className="h-4 w-4" />
              Add New Faculty
            </button>
          </div>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <p className="text-sm">Faculty Management module loading...</p>
      </div>
    </div>
  );
};

export default FacultyManagementPage;
