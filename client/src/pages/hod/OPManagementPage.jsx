import React from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { PlusIcon } from '@heroicons/react/24/outline';

const OPManagementPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="OP (Official Permission)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'OP', href: '/dashboard/hod/op' },
          { label: 'Official Permission' },
        ]}
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <PlusIcon className="h-4 w-4" />
            New OP Request
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <p className="text-sm">Official Permission (OP) module loading...</p>
      </div>
    </div>
  );
};

export default OPManagementPage;
