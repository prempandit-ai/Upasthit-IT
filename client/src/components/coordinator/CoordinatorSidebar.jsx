import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

// Base route prefix for Coordinator
const BASE = '/dashboard/coordinator';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    href: `${BASE}`,
    single: true,
  },
  {
    id: 'events',
    label: 'Events',
    icon: CalendarIcon,
    baseHref: `${BASE}/events`,
    children: [
      { label: 'Create Event', href: `${BASE}/events/create` },
      { label: 'All Events', href: `${BASE}/events` },
      { label: 'Event Calendar', href: `${BASE}/events/calendar` },
    ],
  },
  {
    id: 'participants',
    label: 'Participants',
    icon: UserGroupIcon,
    baseHref: `${BASE}/participants`,
    children: [
      { label: 'Participant List', href: `${BASE}/participants` },
      { label: 'Add Participant', href: `${BASE}/participants/add` },
      { label: 'Import Participants', href: `${BASE}/participants/import` },
    ],
  },
  {
    id: 'faculty',
    label: 'Faculty Management',
    icon: AcademicCapIcon,
    baseHref: `${BASE}/faculty`,
    children: [
      { label: 'Faculty List', href: `${BASE}/faculty` },
      { label: 'Add Faculty', href: `${BASE}/faculty/add` },
      { label: 'Faculty Mapping', href: `${BASE}/faculty/mapping` },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance Mapping',
    icon: ClipboardDocumentCheckIcon,
    baseHref: `${BASE}/attendance-mapping`,
    children: [
      { label: 'Mapping Overview', href: `${BASE}/attendance-mapping` },
      { label: 'Subject to Faculty Mapping', href: `${BASE}/attendance-mapping/subject` },
      { label: 'Event to Faculty Mapping', href: `${BASE}/attendance-mapping/event` },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: ChartBarIcon,
    href: `${BASE}/reports`,
    single: true,
  },
];

const CoordinatorSidebar = ({ open, onClose }) => {
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState({
    events: true,
    participants: false,
    faculty: false,
    attendance: false,
  });

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-black text-sm tracking-wider shadow-xs">
              U
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-blue-700 uppercase leading-none">
                UPASTHIT
              </p>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase mt-0.5">
                CO-ORDINATOR PORTAL
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Role Identity Tag */}
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
          <UserCircleIcon className="h-4 w-4 text-blue-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-900 truncate">
              {user?.name || 'Coordinator'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Event Coordinator Portal
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            if (item.single) {
              const isActive =
                item.href === BASE
                  ? location.pathname === BASE
                  : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  end={item.href === BASE}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              );
            }

            const isSectionActive = location.pathname.startsWith(item.baseHref);
            const isOpen = expanded[item.id] || isSectionActive;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isSectionActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        isSectionActive ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {isOpen ? (
                    <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-3 pt-0.5 pb-1">
                    {item.children.map((child) => {
                      const isChildActive =
                        location.pathname === child.href ||
                        (child.href !== BASE && location.pathname.startsWith(child.href));

                      return (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          onClick={onClose}
                          className={`block rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            isChildActive
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="my-2 border-t border-slate-100" />

          {/* Settings */}
          <NavLink
            to={`${BASE}/settings`}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Cog6ToothIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">Settings</span>
          </NavLink>
        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CoordinatorSidebar;
