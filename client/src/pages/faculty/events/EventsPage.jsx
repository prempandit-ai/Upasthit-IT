import { useState, useMemo } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  ChevronRightIcon,
  SparklesIcon,
  LightBulbIcon,
  HeartIcon,
  MicrophoneIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';
import Modal from '../../../components/faculty/shared/Modal';
import { useToast } from '../../../context/ToastContext';

const INITIAL_EVENTS = [
  {
    id: 'ev-1',
    name: 'AI & ML Workshop',
    description: 'Hands-on workshop on Machine Learning',
    venue: 'Seminar Hall',
    committee: 'GITS Committee',
    dateTime: '28 May 2025, 10:00 AM – 01:00 PM',
    participants: 85,
    status: 'UPCOMING',
    icon: SparklesIcon,
  },
  {
    id: 'ev-2',
    name: 'E-Cell Ideation Bootcamp',
    description: 'Startup & Innovation Bootcamp',
    venue: 'Incubation Center',
    committee: 'E-Cell Events',
    dateTime: '05 Jun 2025, 02:00 PM – 05:00 PM',
    participants: 64,
    status: 'UPCOMING',
    icon: LightBulbIcon,
  },
  {
    id: 'ev-3',
    name: 'NSS Blood Donation Drive',
    description: 'Donate Blood, Save Lives',
    venue: 'College Ground',
    committee: 'NSS',
    dateTime: '12 Jun 2025, 09:00 AM – 02:00 PM',
    participants: 120,
    status: 'UPCOMING',
    icon: HeartIcon,
  },
  {
    id: 'ev-4',
    name: 'Cyber Security Seminar',
    description: 'Awareness on Cyber Security & Ethical Hacking',
    venue: 'Auditorium',
    committee: 'Technical Seminars',
    dateTime: '18 Jun 2025, 11:00 AM – 12:30 PM',
    participants: 150,
    status: 'UPCOMING',
    icon: MicrophoneIcon,
  },
  {
    id: 'ev-5',
    name: "Teachers' Day Celebration",
    description: 'Celebrate the spirit of teaching',
    venue: 'College Auditorium',
    committee: 'Small Events',
    dateTime: '05 Sep 2025, 03:00 PM – 05:00 PM',
    participants: 220,
    status: 'COMPLETED',
    icon: SparklesIcon,
  },
  {
    id: 'ev-6',
    name: 'Hackathon 2025',
    description: '24-hour coding challenge',
    venue: 'Lab 3',
    committee: 'GITS Committee',
    dateTime: '20 Sep 2025, 09:00 AM – Next Day',
    participants: 160,
    status: 'UPCOMING',
    icon: CommandLineIcon,
  },
];

const CATEGORIES = [
  { name: 'GITS Committee Events', count: 6, org: 'Organized by GITS Committee', icon: SparklesIcon },
  { name: 'E-Cell Events', count: 4, org: 'Organized by E-Cell', icon: LightBulbIcon },
  { name: 'NSS Events', count: 3, org: 'Organized by NSS Unit', icon: HeartIcon },
  { name: 'Technical Seminars', count: 3, org: 'Technical talks & seminars', icon: MicrophoneIcon },
  { name: 'Small Events', count: 2, org: 'Other small & cultural events', icon: SparklesIcon },
];

const UPCOMING_7_DAYS = [
  { name: 'AI & ML Workshop', date: '28 May 2025 • 10:00 AM', participants: 85, icon: SparklesIcon },
  { name: 'E-Cell Ideation Bootcamp', date: '05 Jun 2025 • 02:00 PM', participants: 64, icon: LightBulbIcon },
  { name: 'NSS Blood Donation Drive', date: '12 Jun 2025 • 09:00 AM', participants: 120, icon: HeartIcon },
];

const EventsPage = ({ defaultTab = 'All Events', defaultAction = null }) => {
  const { showToast } = useToast();

  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('All Committees');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Create Event Modal
  const [createModalOpen, setCreateModalOpen] = useState(defaultAction === 'create');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [committee, setCommittee] = useState('GITS Committee');
  const [venue, setVenue] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [expectedParticipants, setExpectedParticipants] = useState('50');

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (tab !== 'All Events' && ev.committee !== tab) return false;
      if (committeeFilter !== 'All Committees' && ev.committee !== committeeFilter) return false;
      if (statusFilter !== 'All Status' && ev.status !== statusFilter) return false;
      if (search && !ev.name.toLowerCase().includes(search.toLowerCase()) && !ev.description.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [events, tab, committeeFilter, statusFilter, search]);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!name || !venue || !dateTime) {
      showToast('Please fill all required fields', 'warning');
      return;
    }
    const newEv = {
      id: `ev-${Date.now()}`,
      name,
      description: desc || 'Campus event',
      venue,
      committee,
      dateTime,
      participants: parseInt(expectedParticipants, 10) || 0,
      status: 'UPCOMING',
      icon: SparklesIcon,
    };
    setEvents([newEv, ...events]);
    setCreateModalOpen(false);
    setName('');
    setDesc('');
    showToast('Event created successfully', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Events"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/faculty' },
          { label: 'Events' },
          { label: 'My Events' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Create New Event
          </button>
        }
      />

      {/* ── 4 Top Stat Cards (Screenshot 5) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Events</p>
            <p className="text-2xl font-bold text-slate-900">18</p>
            <p className="text-[11px] text-slate-400">This Semester</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Upcoming Events</p>
            <p className="text-2xl font-bold text-amber-700">7</p>
            <p className="text-[11px] text-amber-600">Next 30 Days</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Participants</p>
            <p className="text-2xl font-bold text-indigo-700">842</p>
            <p className="text-[11px] text-indigo-600">Across All Events</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ClipboardDocumentCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Approvals</p>
            <p className="text-2xl font-bold text-emerald-700">4</p>
            <p className="text-[11px] text-emerald-600">Awaiting Approval</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Bar (Screenshot 5) ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All Committees</option>
              <option>GITS Committee</option>
              <option>E-Cell Events</option>
              <option>NSS</option>
              <option>Technical Seminars</option>
              <option>Small Events</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800"
            >
              <option>All Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <input
              type="text"
              readOnly
              value="01 May 2025 - 31 Dec 2025"
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-600 w-48 text-center"
            />

            <button
              type="button"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCommitteeFilter('All Committees');
                setStatusFilter('All Status');
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs & Event List ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 pb-3 mb-4">
          {['All Events', 'GITS Committee', 'E-Cell Events', 'NSS', 'Technical Seminars', 'Small Events'].map((t) => {
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
                {t}
              </button>
            );
          })}
        </div>

        {/* Table of Events */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Event Details</th>
                <th className="px-4 py-3">Committee</th>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">Participants</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const IconComponent = ev.icon;
                return (
                  <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{ev.name}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{ev.description}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">Venue: {ev.venue}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                        {ev.committee}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{ev.dateTime}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {ev.participants} <span className="text-slate-500 font-normal">Students</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" title="View Event" className="rounded p-1 text-slate-400 hover:text-slate-700">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button type="button" title="More" className="rounded p-1 text-slate-400 hover:text-slate-700">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom 3 Cards: Event Categories, Upcoming 7 Days, Quick Actions (Screenshot 5) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Event Categories */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Event Categories</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.name} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{cat.name}</p>
                      <p className="text-[10px] text-slate-400">{cat.org}</p>
                    </div>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {cat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events (Next 7 Days) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming Events (Next 7 Days)</h3>
            <div className="space-y-3">
              {UPCOMING_7_DAYS.map((ev) => {
                const Icon = ev.icon;
                return (
                  <div key={ev.name} className="flex items-center justify-between rounded-lg border border-slate-100 p-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">{ev.name}</p>
                        <p className="text-[10px] text-slate-400">{ev.date}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">{ev.participants} Part.</span>
                  </div>
                );
              })}
            </div>
          </div>
          <button type="button" className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-700 hover:underline">
            <span>View Full Calendar</span>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Create New Event', desc: 'Organize a new event', action: () => setCreateModalOpen(true) },
              { label: 'Event Requests', desc: 'View & manage requests', action: () => showToast('Navigating to requests', 'info') },
              { label: 'Event Attendance', desc: 'Mark & view attendance', action: () => showToast('Navigating to event attendance', 'info') },
              { label: 'Event Reports', desc: 'Generate event reports', action: () => showToast('Generating event reports', 'info') },
            ].map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={qa.action}
                className="flex w-full items-center justify-between rounded-lg border border-slate-100 p-2.5 text-left hover:bg-slate-50 transition"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{qa.label}</p>
                  <p className="text-[10px] text-slate-400">{qa.desc}</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Create Event Modal ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Campus Event"
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
              onClick={handleCreateEvent}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Publish Event
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Event Name *</label>
            <input
              type="text"
              placeholder="e.g. AI & ML Technical Workshop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Committee / Category</label>
              <select
                value={committee}
                onChange={(e) => setCommittee(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>GITS Committee</option>
                <option>E-Cell Events</option>
                <option>NSS</option>
                <option>Technical Seminars</option>
                <option>Small Events</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Venue *</label>
              <input
                type="text"
                placeholder="e.g. Seminar Hall"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Date &amp; Time *</label>
              <input
                type="text"
                placeholder="e.g. 28 May 2025, 10:00 AM"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Participants</label>
              <input
                type="number"
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Description / Objectives</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Outline the event objectives, speaker details, and target audience..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventsPage;
