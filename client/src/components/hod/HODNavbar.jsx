import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  EnvelopeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

const HODNavbar = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'H';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left section: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-bold tracking-widest text-slate-400 uppercase">
            HOD PORTAL
          </span>
          <span className="hidden sm:inline-block text-slate-300">/</span>
          <h2 className="text-sm font-bold text-slate-900">{pageTitle}</h2>
        </div>
      </div>

      {/* Right section: Icons & Profile */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          onClick={() => showToast('You have 3 pending OP requests awaiting review', 'info')}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
          )}
        </button>

        {/* Messages */}
        <button
          type="button"
          onClick={() => showToast('Department message center', 'info')}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Messages"
          title="Department Messages"
        >
          <EnvelopeIcon className="h-5 w-5" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-xs font-semibold hover:bg-slate-100 transition"
            aria-expanded={dropdownOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-bold text-white shadow-xs">
              {initial}
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[140px] truncate text-xs font-bold text-slate-900">
                {user?.name || 'HOD User'}
              </p>
              <p className="text-[10px] text-slate-500">Head of Department</p>
            </div>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50">
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="truncate text-xs font-bold text-slate-900">
                  {user?.name || 'Authenticated HOD'}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                <span className="mt-1.5 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  ROLE: {user?.role || 'HOD'}
                </span>
              </div>

              <Link
                to="/dashboard/hod/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserCircleIcon className="h-4 w-4 text-slate-400" />
                My Profile
              </Link>

              <Link
                to="/dashboard/hod/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Cog6ToothIcon className="h-4 w-4 text-slate-400" />
                Settings
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 text-rose-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HODNavbar;
