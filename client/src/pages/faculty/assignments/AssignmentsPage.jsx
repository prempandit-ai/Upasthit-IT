import { useState, useMemo } from 'react';
import {
  DocumentPlusIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import Modal from '../../../components/faculty/shared/Modal';
import { useToast } from '../../../context/ToastContext';

const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg-1',
    title: 'DBMS Assignment 1',
    subject: 'DBMS',
    type: 'Individual',
    batch: 'CSE Sem 3',
    dueDate: '25 Aug 2025 11:59 PM',
    submissions: '28 / 60',
    status: 'ACTIVE',
  },
  {
    id: 'asg-2',
    title: 'ER Diagram Design',
    subject: 'DBMS',
    type: 'Group',
    batch: 'CSE Sem 3',
    dueDate: '30 Aug 2025 11:59 PM',
    submissions: '12 / 15',
    status: 'ACTIVE',
  },
  {
    id: 'asg-3',
    title: 'SQL Query Practice',
    subject: 'DBMS',
    type: 'Individual',
    batch: 'CSE Sem 3',
    dueDate: '10 Sep 2025 11:59 PM',
    submissions: '– / 60',
    status: 'UPCOMING',
  },
  {
    id: 'asg-4',
    title: 'Normalization Problems',
    subject: 'DBMS',
    type: 'Individual',
    batch: 'CSE Sem 3',
    dueDate: '–',
    submissions: '– / 60',
    status: 'DRAFT',
  },
  {
    id: 'asg-5',
    title: 'Mini Project – Library System',
    subject: 'DBMS',
    type: 'Group',
    batch: 'CSE Sem 3',
    dueDate: '20 Sep 2025 11:59 PM',
    submissions: '– / 15',
    status: 'UPCOMING',
  },
];

const RECENT_SUBMISSIONS = [
  { id: 'sub-1', name: 'Aarav Sharma', assignment: 'DBMS Assignment 1', submittedOn: '22 Aug 2025 10:15 AM', status: 'SUBMITTED' },
  { id: 'sub-2', name: 'Ananya Patel', assignment: 'DBMS Assignment 1', submittedOn: '22 Aug 2025 10:20 AM', status: 'SUBMITTED' },
  { id: 'sub-3', name: 'Rohan Verma', assignment: 'DBMS Assignment 1', submittedOn: '22 Aug 2025 10:25 AM', status: 'LATE' },
  { id: 'sub-4', name: 'Neha Singh', assignment: 'DBMS Assignment 1', submittedOn: '—', status: 'NOT SUBMITTED' },
  { id: 'sub-5', name: 'Karan Mehta', assignment: 'DBMS Assignment 1', submittedOn: '22 Aug 2025 11:05 AM', status: 'SUBMITTED' },
];

const AssignmentsPage = ({ defaultTab = 'All' }) => {
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [tab, setTab] = useState(defaultTab);
  const [department, setDepartment] = useState('Computer Science');
  const [batch, setBatch] = useState('B.Tech CSE - Sem 3 (2024-28)');
  const [subject, setSubject] = useState('Database Management Systems');
  const [assignmentType, setAssignmentType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Create Assignment Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [asgSubject, setAsgSubject] = useState('DBMS');
  const [asgBatch, setAsgBatch] = useState('CSE Sem 3');
  const [description, setDescription] = useState('');
  const [asgType, setAsgType] = useState('Individual');
  const [totalMarks, setTotalMarks] = useState('100');
  const [dueDate, setDueDate] = useState('');

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (tab !== 'All' && tab !== 'All Assignments') {
        if (a.status.toUpperCase() !== tab.toUpperCase()) return false;
      }
      if (assignmentType !== 'All' && a.type !== assignmentType) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assignments, tab, assignmentType, statusFilter]);

  const handleCreateAssignment = (isDraft = false) => {
    if (!title || !dueDate) {
      showToast('Please provide a title and due date', 'warning');
      return;
    }
    const newAsg = {
      id: `asg-${Date.now()}`,
      title,
      subject: asgSubject,
      type: asgType,
      batch: asgBatch,
      dueDate,
      submissions: '0 / 60',
      status: isDraft ? 'DRAFT' : 'ACTIVE',
    };
    setAssignments([newAsg, ...assignments]);
    setCreateModalOpen(false);
    setTitle('');
    setDescription('');
    showToast(isDraft ? 'Assignment saved as draft' : 'Assignment published successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Assignments"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Assignments' },
          { label: 'Upload Assignment' },
        ]}
      />

      {/* ── 4 Top Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <FolderOpenIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Assignments</p>
            <p className="text-2xl font-bold text-slate-900">18</p>
            <p className="text-[11px] text-slate-400">This Semester</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <ArrowUpTrayIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Assignments</p>
            <p className="text-2xl font-bold text-blue-700">12</p>
            <p className="text-[11px] text-blue-600">Currently Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Submitted</p>
            <p className="text-2xl font-bold text-emerald-700">156</p>
            <p className="text-[11px] text-emerald-600">Submissions</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Evaluation</p>
            <p className="text-2xl font-bold text-amber-700">23</p>
            <p className="text-[11px] text-amber-600">Need Grading</p>
          </div>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Filters</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Subject / Course</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>Database Management Systems</option>
              <option>Operating Systems</option>
              <option>Data Structures</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Assignment Type</label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All</option>
              <option>Individual</option>
              <option>Group</option>
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
              <option value="ACTIVE">Active</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="CLOSED">Closed</option>
              <option value="DRAFT">Drafts</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAssignmentType('All');
                setStatusFilter('All');
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg bg-blue-700 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* ── Table & Tabs Card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Tabs & Create Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex flex-wrap items-center gap-1">
            {['All Assignments', 'Active', 'Upcoming', 'Closed', 'Drafts'].map((t) => {
              const active = tab === t || (t === 'All Assignments' && tab === 'All');
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t === 'All Assignments' ? 'All' : t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create New Assignment
          </button>
        </div>

        {/* Assignments Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sl. No.</th>
                <th className="px-4 py-3">Assignment Title</th>
                <th className="px-4 py-3">Subject / Course</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Batch / Sem</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((a, idx) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.title}</td>
                  <td className="px-4 py-3 text-slate-700">{a.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{a.type}</td>
                  <td className="px-4 py-3 text-slate-600">{a.batch}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.dueDate}</td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-800">{a.submissions}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" title="View Submissions" className="rounded p-1 text-slate-400 hover:text-slate-700">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button type="button" title="Edit Assignment" className="rounded p-1 text-slate-400 hover:text-slate-700">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button type="button" title="More Options" className="rounded p-1 text-slate-400 hover:text-slate-700">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Row: Recent Submissions & Assignment Overview (Screenshot 4) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Submissions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Submissions</h3>
            <button type="button" className="text-xs font-semibold text-blue-700 hover:underline">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="pb-2">Student Name</th>
                  <th className="pb-2">Assignment</th>
                  <th className="pb-2">Submitted On</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_SUBMISSIONS.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-900">{sub.name}</td>
                    <td className="py-2.5 text-slate-600">{sub.assignment}</td>
                    <td className="py-2.5 text-slate-500 whitespace-nowrap">{sub.submittedOn}</td>
                    <td className="py-2.5 text-right"><StatusBadge status={sub.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignment Overview (Screenshot 4 Donut chart) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Assignment Overview (This Semester)
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Donut representation */}
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                {/* Active: 66.7% = stroke-dasharray 58.7 100 */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="58.7 100" />
                {/* Upcoming: 22.2% = offset -58.7, length 19.5 */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray="19.5 100" strokeDashoffset="-58.7" />
                {/* Draft: 11.1% = offset -78.2, length 9.8 */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#94A3B8" strokeWidth="4" strokeDasharray="9.8 100" strokeDashoffset="-78.2" />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-extrabold text-slate-900">18</span>
                <span className="block text-[10px] font-medium uppercase text-slate-500">Total</span>
              </div>
            </div>

            {/* Legend / Metrics */}
            <div className="space-y-2.5 text-xs text-slate-700 min-w-[170px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>Active</span>
                </div>
                <span className="font-semibold text-slate-900">12 (66.7%)</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
                  <span>Upcoming</span>
                </div>
                <span className="font-semibold text-slate-900">4 (22.2%)</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" />
                  <span>Draft</span>
                </div>
                <span className="font-semibold text-slate-900">2 (11.1%)</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                  <span>Closed</span>
                </div>
                <span className="font-semibold text-slate-900">0 (0%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Assignment Modal ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Assignment"
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => handleCreateAssignment(true)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleCreateAssignment(false)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Publish Assignment
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              placeholder="e.g. DBMS Normalization Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={asgSubject}
                onChange={(e) => setAsgSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>DBMS</option>
                <option>Data Structures</option>
                <option>Operating Systems</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Class / Batch</label>
              <select
                value={asgBatch}
                onChange={(e) => setAsgBatch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>CSE Sem 3</option>
                <option>CSE Sem 5</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assignment Type</label>
              <select
                value={asgType}
                onChange={(e) => setAsgType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>Individual</option>
                <option>Group</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Due Date *</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description &amp; Instructions</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide assignment guidelines, questions, and submission instructions..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Attachment (Optional)</label>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-center">
              <span className="text-slate-500">Drag files here or click to browse (PDF, ZIP, DOCX up to 25MB)</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentsPage;
