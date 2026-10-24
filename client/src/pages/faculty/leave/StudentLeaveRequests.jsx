import { ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';

const StudentLeaveRequests = () => (
  <div className="space-y-6 pb-12">
    <PageHeader title="Student Leave Requests" breadcrumbs={[{ label: 'Home', href: '/dashboard/faculty' }, { label: 'Leave Management' }, { label: 'Student Requests' }]} />
    <section className="max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-3"><ExclamationTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Review authority has not been configured</h2><p className="mt-2 text-sm leading-6 text-amber-900">Students can submit leave requests and see their saved status in the mobile app. The project does not define which faculty, coordinator, or HOD may review a request, and it has no real review endpoint yet. This page therefore has no approval or rejection controls. Confirm the institution’s approval policy before enabling review access.</p></div></div>
    </section>
    <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><ClipboardDocumentCheckIcon className="h-6 w-6 text-slate-500" /><div><h2 className="font-semibold text-slate-900">Student request records</h2><p className="text-sm text-slate-500">Leave applications are persisted, but they are not assigned to a reviewer under the current policy.</p></div></div></section>
  </div>
);

export default StudentLeaveRequests;
