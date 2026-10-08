import { useState, useMemo } from 'react';
import {
  MegaphoneIcon,
  EyeIcon,
  CalendarDaysIcon,
  BookmarkSquareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  EllipsisVerticalIcon,
  ChevronRightIcon,
  BellAlertIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import Modal from '../../../components/faculty/shared/Modal';
import { useToast } from '../../../context/ToastContext';
import useAuth from '../../../hooks/useAuth';

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Mid-Term Examination Schedule Released',
    excerpt: 'Detailed timetable for Semester 3 mid-term exams is now available.',
    category: 'Department Notices',
    postedOn: '20 Aug 2025',
    postedBy: 'HOD Computer Science',
    status: 'PINNED',
  },
  {
    id: 'ann-2',
    title: 'DBMS Lab Session Rescheduled',
    excerpt: 'Tomorrow’s 2 PM DBMS Lab for CSE Sem 3-B is moved to Lab 2.',
    category: 'Class Notifications',
    postedOn: '19 Aug 2025',
    postedBy: 'Prof. John Doe',
    status: 'PUBLISHED',
  },
  {
    id: 'ann-3',
    title: 'Campus Placement Drive – TCS & Infosys',
    excerpt: 'Pre-placement talk and registration link for final year students.',
    category: 'General Announcements',
    postedOn: '18 Aug 2025',
    postedBy: 'Placement Cell',
    status: 'PUBLISHED',
  },
  {
    id: 'ann-4',
    title: 'Guest Lecture on Cloud Computing Architectures',
    excerpt: 'Dr. Suresh Kumar from AWS will be conducting a virtual lecture on Friday.',
    category: 'Custom Announcements',
    postedOn: '15 Aug 2025',
    postedBy: 'Prof. Priya Nair',
    status: 'PUBLISHED',
  },
  {
    id: 'ann-5',
    title: 'Library Book Return Reminder',
    excerpt: 'All overdue books must be returned by end of this week without penalty.',
    category: 'General Announcements',
    postedOn: '12 Aug 2025',
    postedBy: 'Central Library',
    status: 'EXPIRED',
  },
  {
    id: 'ann-6',
    title: 'Draft: National Level Technical Paper Presentation',
    excerpt: 'Guidelines and review committee formation for upcoming paper conference.',
    category: 'Department Notices',
    postedOn: '10 Aug 2025',
    postedBy: 'Prof. John Doe',
    status: 'DRAFT',
  },
];

const CATEGORY_ITEMS = [
  { name: 'General Announcements', count: 12, desc: 'College-wide official updates' },
  { name: 'Class Notifications', count: 8, desc: 'Batch and lecture specific notices' },
  { name: 'Custom Announcements', count: 5, desc: 'Club and specialized communications' },
  { name: 'Department Notices', count: 3, desc: 'Official CSE department alerts' },
];

const PINNED_ITEMS = [
  { title: 'Mid-Term Examination Schedule Released', date: '20 Aug 2025', category: 'Department Notices' },
  { title: 'Campus Placement Drive – TCS & Infosys', date: '18 Aug 2025', category: 'General Announcements' },
];

const CampusPage = ({ defaultTab = 'general' }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(
    defaultTab === 'class'
      ? 'Class Notifications'
      : defaultTab === 'custom'
      ? 'Custom Announcements'
      : defaultTab === 'department'
      ? 'Department Notices'
      : 'General Announcements'
  );

  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General Announcements');
  const [newAudience, setNewAudience] = useState('All');
  const [newPriority, setNewPriority] = useState('Normal');
  const [newPinned, setNewPinned] = useState(false);

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      if (item.category !== activeTab) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.excerpt.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [announcements, activeTab, statusFilter, search]);

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showToast('Please provide a title and content', 'warning');
      return;
    }
    const newEntry = {
      id: `ann-${Date.now()}`,
      title: newTitle,
      excerpt: newContent.length > 80 ? `${newContent.substring(0, 80)}...` : newContent,
      category: newCategory,
      postedOn: 'Today',
      postedBy: `Prof. ${user?.name || 'Faculty'}`,
      status: newPinned ? 'PINNED' : 'PUBLISHED',
    };
    setAnnouncements([newEntry, ...announcements]);
    setCreateModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewPinned(false);
    showToast('Announcement posted successfully!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Campus Tab"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Campus Tab' },
          { label: activeTab },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Announcement
          </button>
        }
      />

      {/* ── 4 Top Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <MegaphoneIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Announcements</p>
            <p className="text-2xl font-bold text-slate-900">28</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <EyeIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Views</p>
            <p className="text-2xl font-bold text-emerald-700">1,420</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">This Month</p>
            <p className="text-2xl font-bold text-amber-700">8</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <BookmarkSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pinned Notices</p>
            <p className="text-2xl font-bold text-purple-700">3</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option value="All">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="PINNED">Pinned</option>
              <option value="DRAFT">Draft</option>
              <option value="EXPIRED">Expired</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs & Announcements Table ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-3 mb-4">
          {[
            'General Announcements',
            'Class Notifications',
            'Custom Announcements',
            'Department Notices',
          ].map((t) => {
            const count = announcements.filter((a) => a.category === t).length;
            const active = activeTab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Announcement</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Posted On</th>
                <th className="px-4 py-3">Posted By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No announcements in this category match your search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.excerpt}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.category}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.postedOn}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{item.postedBy}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" title="View" className="rounded p-1 text-slate-400 hover:text-slate-700">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button type="button" title="Edit" className="rounded p-1 text-slate-400 hover:text-slate-700">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button type="button" title="More" className="rounded p-1 text-slate-400 hover:text-slate-700">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Campus Sections: Categories, Pinned, Quick Actions ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Announcement Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Announcement Categories</h3>
          <div className="space-y-3">
            {CATEGORY_ITEMS.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setActiveTab(cat.name)}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50 cursor-pointer transition"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{cat.name}</p>
                  <p className="text-[10px] text-slate-400">{cat.desc}</p>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pinned Announcements */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Pinned Announcements</h3>
          <div className="space-y-3">
            {PINNED_ITEMS.map((p) => (
              <div key={p.title} className="rounded-lg border border-purple-100 bg-purple-50/30 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 uppercase">
                  <BookmarkSquareIcon className="h-3.5 w-3.5" />
                  <span>{p.category}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">{p.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Create New Announcement', action: () => setCreateModalOpen(true) },
              { label: 'Create Class Notification', action: () => { setNewCategory('Class Notifications'); setCreateModalOpen(true); } },
              { label: 'Create Custom Announcement', action: () => { setNewCategory('Custom Announcements'); setCreateModalOpen(true); } },
              { label: 'View Announcement Reports', action: () => showToast('Generating analytics report', 'info') },
            ].map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={qa.action}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-2.5 text-left hover:bg-slate-50 transition"
              >
                <span className="text-xs font-semibold text-slate-900">{qa.label}</span>
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create Announcement Modal ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Publish Campus Announcement"
        maxWidth="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateAnnouncement}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
            >
              Publish Notice
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. Rescheduled Lab Session Notice"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>General Announcements</option>
                <option>Class Notifications</option>
                <option>Custom Announcements</option>
                <option>Department Notices</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>All Students &amp; Faculty</option>
                <option>Computer Science Department</option>
                <option>B.Tech CSE - Sem 3</option>
                <option>B.Tech CSE - Sem 5</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Announcement Content *</label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write the full announcement text here..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinCheck"
              checked={newPinned}
              onChange={(e) => setNewPinned(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
            <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700">
              Pin this announcement to top of portal
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampusPage;
