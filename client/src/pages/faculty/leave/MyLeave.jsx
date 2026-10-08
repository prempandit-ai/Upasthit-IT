import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import Modal from '../../../components/faculty/shared/Modal';
import { useToast } from '../../../context/ToastContext';

const INITIAL_MY_LEAVES = [
  { id: 'ml-1', type: 'Casual Leave', fromDate: '10 Aug 2025', toDate: '11 Aug 2025', totalDays: '2', reason: 'Personal Work', status: 'APPROVED', appliedOn: '08 Aug 2025' },
  { id: 'ml-2', type: 'Medical Leave', fromDate: '05 Aug 2025', toDate: '07 Aug 2025', totalDays: '3', reason: 'Fever', status: 'APPROVED', appliedOn: '04 Aug 2025' },
  { id: 'ml-3', type: 'Casual Leave', fromDate: '25 Jul 2025', toDate: '25 Jul 2025', totalDays: '1', reason: 'Family Function', status: 'APPROVED', appliedOn: '24 Jul 2025' },
  { id: 'ml-4', type: 'Casual Leave', fromDate: '18 Jul 2025', toDate: '18 Jul 2025', totalDays: '1', reason: 'Personal Work', status: 'REJECTED', appliedOn: '17 Jul 2025' },
  { id: 'ml-5', type: 'Medical Leave', fromDate: '12 Jul 2025', toDate: '14 Jul 2025', totalDays: '3', reason: 'Health Issue', status: 'APPROVED', appliedOn: '11 Jul 2025' },
];

const MyLeave = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState(INITIAL_MY_LEAVES);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave');
  const [newLeaveFrom, setNewLeaveFrom] = useState('');
  const [newLeaveTo, setNewLeaveTo] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  const handleApplyLeaveSubmit = (e) => {
    e.preventDefault();
    if (!newLeaveFrom || !newLeaveTo || !newLeaveReason) {
      showToast('Please fill all fields', 'warning');
      return;
    }
    const newEntry = {
      id: `ml-${Date.now()}`,
      type: newLeaveType,
      fromDate: newLeaveFrom,
      toDate: newLeaveTo,
      totalDays: '1',
      reason: newLeaveReason,
      status: 'PENDING',
      appliedOn: 'Today',
    };
    setLeaves([newEntry, ...leaves]);
    setApplyModalOpen(false);
    setNewLeaveReason('');
    showToast('Leave application submitted successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Leave (Personal Leave)"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Leave Management' },
          { label: 'My Leave' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Apply for Leave
          </button>
        }
      />

      {/* 4 Leave Balance cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Casual Leave</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
          <p className="text-[11px] text-slate-400">Days Left</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Medical Leave</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">7</p>
          <p className="text-[11px] text-slate-400">Days Left</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Earned Leave</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">10</p>
          <p className="text-[11px] text-slate-400">Days Left</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Compensatory Off</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">2</p>
          <p className="text-[11px] text-slate-400">Days Left</p>
        </div>
      </div>

      {/* Leave Application History Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Leave Application History</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sl. No.</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">From Date</th>
                <th className="px-4 py-3">To Date</th>
                <th className="px-4 py-3">Total Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.type}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.fromDate}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.toDate}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.totalDays}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.appliedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Faculty Leave"
        footer={
          <>
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyLeaveSubmit}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              Submit Application
            </button>
          </>
        }
      >
        <form onSubmit={handleApplyLeaveSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Leave Type *</label>
            <select
              value={newLeaveType}
              onChange={(e) => setNewLeaveType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option>Casual Leave</option>
              <option>Medical Leave</option>
              <option>Earned Leave</option>
              <option>Compensatory Off</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">From Date *</label>
              <input
                type="date"
                value={newLeaveFrom}
                onChange={(e) => setNewLeaveFrom(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">To Date *</label>
              <input
                type="date"
                value={newLeaveTo}
                onChange={(e) => setNewLeaveTo(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              value={newLeaveReason}
              onChange={(e) => setNewLeaveReason(e.target.value)}
              placeholder="State the reason clearly..."
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyLeave;
