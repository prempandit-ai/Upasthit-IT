import React from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const DepartmentOverviewPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Overview"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'Department Overview' },
        ]}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
            Export Overview
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <p className="text-sm">Department Overview module loading...</p>
      </div>
    </div>
  );
};

export default DepartmentOverviewPage;
