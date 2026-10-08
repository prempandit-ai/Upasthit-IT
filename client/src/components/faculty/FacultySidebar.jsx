import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  FolderOpenIcon,
  MegaphoneIcon,
  CalendarIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

// ─── Sidebar navigation tree ──────────────────────────────────────────────────
// Route prefix: /dashboard/faculty
const PFX = '/dashboard/faculty';

const NAV_SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    href: `${PFX}`,
    single: true,
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: ClipboardDocumentCheckIcon,
    children: [
      { label: 'Take Attendance', href: `${PFX}/attendance/take` },
      { label: 'Attendance History', href: `${PFX}/attendance/history` },
      { label: 'Class-wise Attendance', href: `${PFX}/attendance/class-wise` },
      { label: 'Batch-wise Attendance', href: `${PFX}/attendance/batch-wise` },
      { label: 'Day-wise Attendance', href: `${PFX}/attendance/day-wise` },
      { label: 'Event Attendance Approval', href: `${PFX}/attendance/event-approval` },
    ],
  },
  {
    id: 'leave',
    label: 'Leave Management',
    icon: DocumentTextIcon,
    children: [
      { label: 'Student Leave Requests', href: `${PFX}/leave/student-requests` },
      { label: 'My Leave', href: `${PFX}/leave/my-leave` },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: CalendarDaysIcon,
    children: [
      { label: "Today's Schedule", href: `${PFX}/schedule/today` },
      { label: 'Manage Schedule', href: `${PFX}/schedule/manage` },
    ],
  },
  {
    id: 'study-plan',
    label: 'Study Plan',
    icon: BookOpenIcon,
    children: [
      { label: 'Upload Study Plan', href: `${PFX}/study-plan/upload` },
      { label: 'View Previous Plans', href: `${PFX}/study-plan/history` },
    ],
  },
  {
    id: 'assignments',
    label: 'Assignments',
    icon: FolderOpenIcon,
    children: [
      { label: 'Upload Assignment', href: `${PFX}/assignments` },
      { label: 'Manage Assignments', href: `${PFX}/assignments/manage` },
      { label: 'View Submissions', href: `${PFX}/assignments/submissions` },
      { label: 'Assignment Analytics', href: `${PFX}/assignments/analytics` },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    icon: CalendarIcon,
    children: [
      { label: 'My Events', href: `${PFX}/events` },
      { label: 'Create Event', href: `${PFX}/events/create` },
      { label: 'Event Requests', href: `${PFX}/events/requests` },
      { label: 'Event Participants', href: `${PFX}/events/participants` },
      { label: 'Event Attendance', href: `${PFX}/events/attendance` },
    ],
  },
  {
    id: 'campus',
    label: 'Campus Tab',
    icon: MegaphoneIcon,
    children: [
      { label: 'General Announcements', href: `${PFX}/campus/announcements` },
      { label: 'Class Notifications', href: `${PFX}/campus/class-notifications` },
      { label: 'Custom Announcements', href: `${PFX}/campus/custom-announcements` },
      { label: 'Department Notices', href: `${PFX}/campus/department-notices` },
    ],
  },
];

const BOTTOM_ITEMS = [
  { id: 'reports', label: 'Reports', icon: ChartBarIcon, href: `${PFX}/reports` },
  { id: 'profile', label: 'Profile', icon: UserCircleIcon, href: `${PFX}/profile` },
  { id: 'settings', label: 'Settings', icon: Cog6ToothIcon, href: `${PFX}/settings` },
];

// ─── Component ────────────────────────────────────────────────────────────────

const FacultySidebar = ({ open, onClose }) => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState({ attendance: true });

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-700 uppercase">UPASTHIT</p>
            <p className="text-sm font-semibold text-slate-800">Faculty Portal</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-3">
            {NAV_SECTIONS.map((section) => {
              if (section.single) {
                return (
                  <li key={section.id}>
                    <NavLink
                      to={section.href}
                      end
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <section.icon className="h-4 w-4 shrink-0" />
                      {section.label}
                    </NavLink>
                  </li>
                );
              }

              const isOpen = expanded[section.id];

              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-3">
                      <section.icon className="h-4 w-4 shrink-0" />
                      {section.label}
                    </span>
                    {isOpen ? (
                      <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-slate-100 pl-3">
                      {section.children.map((child) => (
                        <li key={child.href}>
                          <NavLink
                            to={child.href}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `block rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mx-4 my-3 border-t border-slate-100" />

          <ul className="space-y-0.5 px-3">
            {BOTTOM_ITEMS.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default FacultySidebar;
