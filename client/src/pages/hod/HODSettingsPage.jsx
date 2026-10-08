import React from 'react';
import PageHeader from '../../components/shared/PageHeader';

const HODSettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/hod' },
          { label: 'Settings' },
        ]}
      />

      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Portal Preferences</h3>
        <p className="text-xs text-slate-500">Configure notifications, export formats, and view settings.</p>
      </div>
    </div>
  );
};

export default HODSettingsPage;
