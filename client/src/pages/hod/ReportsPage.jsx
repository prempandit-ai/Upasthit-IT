import React from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'Reports', href: '/dashboard/hod/reports' },
          { label: 'Reports Dashboard' },
        ]}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export All Reports
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <p className="text-sm">Reports module loading...</p>
      </div>
    </div>
  );
};

export default ReportsPage;
