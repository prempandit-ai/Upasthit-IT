import { useState } from 'react';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';

const FacultySettingsPage = () => {
  const { showToast } = useToast();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [attendanceReminders, setAttendanceReminders] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Preferences saved successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Settings & Preferences"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Settings' },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Notification Preferences</h2>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Email Notifications</p>
              <p className="text-slate-500">Receive student leave requests and exam updates via email.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">Attendance Reminders</p>
              <p className="text-slate-500">Get notified 10 minutes prior to scheduled lecture time.</p>
            </div>
            <input
              type="checkbox"
              checked={attendanceReminders}
              onChange={(e) => setAttendanceReminders(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">SMS Alerts</p>
              <p className="text-slate-500">Urgent campus announcements sent to your registered phone.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};

export default FacultySettingsPage;
