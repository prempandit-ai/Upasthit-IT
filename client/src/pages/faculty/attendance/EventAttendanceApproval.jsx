import { useState } from 'react';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import { useToast } from '../../../context/ToastContext';

const INITIAL_EVENT_APPROVALS = [
  { id: 'e1', name: 'AI & ML Seminar', date: '25 Aug 2025', requestedBy: 'Prof. Priya Nair', department: 'Computer Science', participants: 85, status: 'PENDING' },
  { id: 'e2', name: 'CodeSprint 2025', date: '30 Aug 2025', requestedBy: 'Prof. Rahul Joshi', department: 'Computer Science', participants: 60, status: 'PENDING' },
  { id: 'e3', name: 'Industry Visit - Infosys', date: '05 Sep 2025', requestedBy: 'Prof. Meena Iyer', department: 'Information Tech', participants: 40, status: 'PENDING' },
  { id: 'e4', name: 'Web3 Workshop', date: '10 Aug 2025', requestedBy: 'Prof. Amit Shah', department: 'Computer Science', participants: 50, status: 'APPROVED' },
  { id: 'e5', name: 'Gaming Tournament', date: '02 Aug 2025', requestedBy: 'Student Club', department: 'General', participants: 30, status: 'REJECTED' },
];

const EventAttendanceApproval = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState('PENDING');
  const [approvals, setApprovals] = useState(INITIAL_EVENT_APPROVALS);

  const handleApprove = (id) => {
    setApprovals((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'APPROVED' } : e))
    );
    showToast('Event attendance approved', 'success');
  };

  const handleReject = (id) => {
    setApprovals((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'REJECTED' } : e))
    );
    showToast('Event attendance rejected', 'warning');
  };

  const currentList = approvals.filter((a) => a.status === tab);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Event Attendance Approval"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Attendance', href: '/dashboard/faculty/attendance/take' },
          { label: 'Event Attendance Approval' },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((t) => {
            const count = approvals.filter((a) => a.status === t).length;
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Event Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Total Participants</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No {tab.toLowerCase()} event attendance requests found.
                  </td>
                </tr>
              ) : (
                currentList.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{ev.name}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.date}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.department}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.requestedBy}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{ev.participants}</td>
                    <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {ev.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(ev.id)}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(ev.id)}
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventAttendanceApproval;
