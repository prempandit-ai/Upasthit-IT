import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

const FacultyNavbar = ({ onToggleSidebar, pageTitle = 'Faculty Dashboard' }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'F';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* Desktop brand */}
        <div className="hidden lg:block">
          <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">UPASTHIT</span>
          <span className="ml-2 text-sm font-medium text-slate-400">/ Faculty Portal</span>
        </div>

        {/* Mobile page title */}
        <p className="text-sm font-semibold text-slate-800 lg:hidden">{pageTitle}</p>
      </div>

      {/* Right: actions + profile */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Search"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {/* Notification dot – show only when there are unread notifications */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
              {initial}
            </div>
            <span className="hidden max-w-32 truncate font-medium text-slate-700 sm:block">
              {user?.name ?? 'Faculty'}
            </span>
            <ChevronDownIcon
              className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>

              <button
                type="button"
                onClick={() => { setDropdownOpen(false); navigate('/dashboard/faculty/profile'); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserCircleIcon className="h-4 w-4 text-slate-400" />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => { setDropdownOpen(false); navigate('/dashboard/faculty/settings'); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Cog6ToothIcon className="h-4 w-4 text-slate-400" />
                Settings
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default FacultyNavbar;
