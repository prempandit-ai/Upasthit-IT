import React, { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import {
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const CoordinatorSettingsPage = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    emailOnRegistration: true,
    emailOnAttendanceComplete: true,
    autoConfirmEligibleStudents: true,
    allowWaitlist: true,
    requireFacultyAttendanceVerification: true,
    twoFactorAuth: false,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast('Preference updated', 'info');
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <PageHeader
        title="Portal & System Settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Settings' },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <BellIcon className="h-4 w-4 text-blue-600" />
            Notification Preferences
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">New Registration Alerts</p>
                <p className="text-[11px] text-slate-500">Receive email notifications when students register for your events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailOnRegistration}
                onChange={() => handleToggle('emailOnRegistration')}
                className="h-4 w-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Attendance Submission Alerts</p>
                <p className="text-[11px] text-slate-500">Get notified when assigned faculty submits live session attendance</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailOnAttendanceComplete}
                onChange={() => handleToggle('emailOnAttendanceComplete')}
                className="h-4 w-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Operational Automation */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cog6ToothIcon className="h-4 w-4 text-blue-600" />
            Registration & Attendance Automation
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Auto-Confirm Eligible Students</p>
                <p className="text-[11px] text-slate-500">Automatically confirm registrations that meet department & year eligibility</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoConfirmEligibleStudents}
                onChange={() => handleToggle('autoConfirmEligibleStudents')}
                className="h-4 w-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable Waitlist on Capacity Full</p>
                <p className="text-[11px] text-slate-500">Allow students to join waitlist when event max capacity is reached</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowWaitlist}
                onChange={() => handleToggle('allowWaitlist')}
                className="h-4 w-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
            Security & Authentication
          </h3>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-500">Require OTP verification for approving bulk participant rosters</p>
            </div>
            <input
              type="checkbox"
              checked={settings.twoFactorAuth}
              onChange={() => handleToggle('twoFactorAuth')}
              className="h-4 w-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSettingsPage;
