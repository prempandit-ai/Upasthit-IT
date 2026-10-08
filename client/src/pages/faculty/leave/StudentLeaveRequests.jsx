import { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import Modal from '../../../components/faculty/shared/Modal';
import { useToast } from '../../../context/ToastContext';
import {
  getStudentLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  sendBackLeaveRequest,
  applyForLeave,
} from '../../../services/facultyService';

const INITIAL_REQUESTS = [
  {
    id: 'lr-1',
    studentName: 'Aarav Sharma',
    rollNo: 'CS2023001',
    classGroup: 'B.Tech CSE - Sem 3 Section B',
    leaveType: 'Medical Leave',
    fromDate: '21 Aug 2025',
    toDate: '23 Aug 2025',
    totalDays: '3 Days',
    reason: 'Fever and rest advised by doctor.',
    appliedOn: '20 Aug 2025 10:30 AM',
    contactNo: '9876543210',
    status: 'PENDING',
    attachment: 'Medical_Certificate.pdf (320 KB)',
  },
  {
    id: 'lr-2',
    studentName: 'Ananya Patel',
    rollNo: 'CS2023002',
    classGroup: 'B.Tech CSE - Sem 3 Section A',
    leaveType: 'Personal Leave',
    fromDate: '25 Aug 2025',
    toDate: '26 Aug 2025',
    totalDays: '2 Days',
    reason: 'Attending family wedding ceremony out of station.',
    appliedOn: '19 Aug 2025 02:15 PM',
    contactNo: '9876543211',
    status: 'PENDING',
    attachment: null,
  },
  {
    id: 'lr-3',
    studentName: 'Rohan Verma',
    rollNo: 'CS2023003',
    classGroup: 'B.Tech CSE - Sem 3 Section B',
    leaveType: 'Medical Leave',
    fromDate: '18 Aug 2025',
    toDate: '20 Aug 2025',
    totalDays: '3 Days',
    reason: 'Severe migraine attack.',
    appliedOn: '18 Aug 2025 09:00 AM',
    contactNo: '9876543212',
    status: 'APPROVED',
    attachment: 'Prescription.pdf (180 KB)',
  },
  {
    id: 'lr-4',
    studentName: 'Neha Singh',
    rollNo: 'CS2023004',
    classGroup: 'B.Tech CSE - Sem 3 Section A',
    leaveType: 'Personal Leave',
    fromDate: '22 Aug 2025',
    toDate: '22 Aug 2025',
    totalDays: '1 Day',
    reason: 'Passport office appointment for document verification.',
    appliedOn: '17 Aug 2025 11:20 AM',
    contactNo: '9876543213',
    status: 'REJECTED',
    attachment: null,
  },
  {
    id: 'lr-5',
    studentName: 'Karan Mehta',
    rollNo: 'CS2023005',
    classGroup: 'B.Tech CSE - Sem 3 Section B',
    leaveType: 'Medical Leave',
    fromDate: '16 Aug 2025',
    toDate: '17 Aug 2025',
    totalDays: '2 Days',
    reason: 'Food poisoning and stomach infection.',
    appliedOn: '15 Aug 2025 04:45 PM',
    contactNo: '9876543214',
    status: 'APPROVED',
    attachment: 'Doctor_Note.pdf (250 KB)',
  },
];

const INITIAL_MY_LEAVES = [
  { id: 'ml-1', type: 'Casual Leave', fromDate: '10 Aug 2025', toDate: '11 Aug 2025', totalDays: '2', reason: 'Personal Work', status: 'APPROVED', appliedOn: '08 Aug 2025' },
  { id: 'ml-2', type: 'Medical Leave', fromDate: '05 Aug 2025', toDate: '07 Aug 2025', totalDays: '3', reason: 'Fever', status: 'APPROVED', appliedOn: '04 Aug 2025' },
  { id: 'ml-3', type: 'Casual Leave', fromDate: '25 Jul 2025', toDate: '25 Jul 2025', totalDays: '1', reason: 'Family Function', status: 'APPROVED', appliedOn: '24 Jul 2025' },
  { id: 'ml-4', type: 'Casual Leave', fromDate: '18 Jul 2025', toDate: '18 Jul 2025', totalDays: '1', reason: 'Personal Work', status: 'REJECTED', appliedOn: '17 Jul 2025' },
  { id: 'ml-5', type: 'Medical Leave', fromDate: '12 Jul 2025', toDate: '14 Jul 2025', totalDays: '3', reason: 'Health Issue', status: 'APPROVED', appliedOn: '11 Jul 2025' },
];

const StudentLeaveRequests = () => {
  const { showToast } = useToast();

  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState(INITIAL_REQUESTS[0]);

  // Filters
  const [department, setDepartment] = useState('Computer Science');
  const [batch, setBatch] = useState('B.Tech CSE - Sem 3 (2024-28)');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // My Leave
  const [myLeaves, setMyLeaves] = useState(INITIAL_MY_LEAVES);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave');
  const [newLeaveFrom, setNewLeaveFrom] = useState('');
  const [newLeaveTo, setNewLeaveTo] = useState('');
  const [newLeaveReason, setNewLeaveReason] = useState('');

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (leaveTypeFilter !== 'All' && r.leaveType !== leaveTypeFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      return true;
    });
  }, [requests, leaveTypeFilter, statusFilter]);

  const handleApprove = async (id) => {
    try {
      await approveLeaveRequest(id);
      showToast('Leave request approved', 'success');
    } catch {
      showToast('Approved (dev state updated)', 'info');
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: 'APPROVED' }));
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectLeaveRequest(id);
      showToast('Leave request rejected', 'warning');
    } catch {
      showToast('Rejected (dev state updated)', 'info');
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'REJECTED' } : r))
    );
    if (selectedRequest?.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: 'REJECTED' }));
    }
  };

  const handleSendBack = async (id) => {
    try {
      await sendBackLeaveRequest(id, 'More documentation needed');
      showToast('Leave request sent back to student for clarification', 'info');
    } catch {
      showToast('Sent back (dev state updated)', 'info');
    }
  };

  const handleApplyLeaveSubmit = (e) => {
    e.preventDefault();
    if (!newLeaveFrom || !newLeaveTo || !newLeaveReason) {
      showToast('Please fill all required fields', 'warning');
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
    setMyLeaves([newEntry, ...myLeaves]);
    setApplyModalOpen(false);
    setNewLeaveReason('');
    showToast('Leave application submitted successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Leave Management - Student Leave Requests"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Leave Management' },
          { label: 'Student Leave Requests' },
        ]}
      />

      {/* ── 4 Top Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Requests</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-slate-400">This Month</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending (HOD)</p>
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-[11px] text-amber-600">Awaiting Approval</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Approved</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
            <p className="text-[11px] text-emerald-600">This Month</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <XCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-rose-700">{stats.rejected}</p>
            <p className="text-[11px] text-rose-600">This Month</p>
          </div>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Filters</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>Computer Science</option>
              <option>Information Technology</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch / Semester</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>B.Tech CSE - Sem 3 (2024-28)</option>
              <option>B.Tech CSE - Sem 5 (2023-27)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Leave Type</label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              <option>Medical Leave</option>
              <option>Personal Leave</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Student Leave Requests Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Student Leave Requests</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sl. No.</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Roll No.</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">From Date</th>
                <th className="px-4 py-3">To Date</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req, idx) => (
                <tr
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`cursor-pointer transition-colors ${
                    selectedRequest?.id === req.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{req.studentName}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{req.rollNo}</td>
                  <td className="px-4 py-3 text-slate-700">{req.leaveType}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.fromDate}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{req.toDate}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{req.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{req.appliedOn}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(req);
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Request Details Card (Screenshot 2 bottom center) ── */}
      {selectedRequest && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-base font-semibold text-slate-900">Request Details</h3>
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Student Profile column */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white shadow-sm">
                {selectedRequest.studentName.charAt(0)}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{selectedRequest.studentName}</p>
              <p className="text-xs font-mono text-slate-500">{selectedRequest.rollNo}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedRequest.classGroup}</p>
              <button
                type="button"
                className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                View Profile
              </button>
            </div>

            {/* Leave Information column */}
            <div className="space-y-2.5 text-xs text-slate-600 lg:col-span-1">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Leave Type:</span>
                <span className="font-semibold text-slate-900">{selectedRequest.leaveType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">From Date:</span>
                <span className="font-medium text-slate-900">{selectedRequest.fromDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">To Date:</span>
                <span className="font-medium text-slate-900">{selectedRequest.toDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Total Days:</span>
                <span className="font-semibold text-slate-900">{selectedRequest.totalDays}</span>
              </div>
              <div className="border-b border-slate-100 pb-1.5">
                <span className="block text-slate-400 mb-0.5">Reason:</span>
                <span className="font-medium text-slate-800">{selectedRequest.reason}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Applied On:</span>
                <span className="text-slate-700">{selectedRequest.appliedOn}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Contact No.:</span>
                <span className="text-slate-700">{selectedRequest.contactNo}</span>
              </div>
              {selectedRequest.attachment && (
                <div className="pt-2">
                  <span className="block text-slate-400 mb-1">Attachments:</span>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                    <span className="truncate font-medium text-slate-800">{selectedRequest.attachment}</span>
                    <ArrowDownTrayIcon className="h-4 w-4 text-blue-600 cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Status Timeline</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px]">✓</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Request Submitted</p>
                    <p className="text-[10px] text-slate-400">{selectedRequest.appliedOn}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px]">●</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Under Review (HOD)</p>
                    <p className="text-[10px] text-slate-400">Awaiting faculty recommendations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                    selectedRequest.status === 'APPROVED' ? 'bg-emerald-500 text-white' : selectedRequest.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {selectedRequest.status === 'APPROVED' ? '✓' : selectedRequest.status === 'REJECTED' ? '✕' : '3'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {selectedRequest.status === 'APPROVED' ? 'Approved' : selectedRequest.status === 'REJECTED' ? 'Rejected' : 'Approval Decision'}
                    </p>
                    <p className="text-[10px] text-slate-400">—</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4">
                <button
                  type="button"
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleSendBack(selectedRequest.id)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Send Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── My Leave (Personal Leave) Card (Screenshot 2 bottom) ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">My Leave (Personal Leave)</h3>
          <button
            type="button"
            onClick={() => setApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Apply for Leave
          </button>
        </div>

        {/* 4 Leave Balance cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-medium text-slate-500">Casual Leave</p>
            <p className="text-xl font-bold text-slate-900 mt-1">12</p>
            <p className="text-[11px] text-slate-400">Days Left</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-medium text-slate-500">Medical Leave</p>
            <p className="text-xl font-bold text-slate-900 mt-1">7</p>
            <p className="text-[11px] text-slate-400">Days Left</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-medium text-slate-500">Earned Leave</p>
            <p className="text-xl font-bold text-slate-900 mt-1">10</p>
            <p className="text-[11px] text-slate-400">Days Left</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs font-medium text-slate-500">Compensatory Off</p>
            <p className="text-xl font-bold text-slate-900 mt-1">2</p>
            <p className="text-[11px] text-slate-400">Days Left</p>
          </div>
        </div>

        {/* My Leave Table */}
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
              {myLeaves.map((item, idx) => (
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
      </section>

      {/* ── Apply for Leave Modal ── */}
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

export default StudentLeaveRequests;
