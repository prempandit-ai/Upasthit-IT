import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CoordinatorSidebar from '../components/coordinator/CoordinatorSidebar';
import CoordinatorNavbar from '../components/coordinator/CoordinatorNavbar';

/**
 * CoordinatorLayout
 * Dedicated layout for all /dashboard/coordinator/* routes.
 * Features responsive sidebar, top navbar, scrollable content area, and portal footer.
 */
const CoordinatorLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <CoordinatorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <CoordinatorNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>

          {/* Academic Portal Footer matching screenshot */}
          <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <p>© 2025 College Management System. All rights reserved.</p>
              <div className="flex items-center gap-4 text-slate-500">
                <a href="#help" className="hover:text-blue-600 transition">Help Center</a>
                <span>|</span>
                <a href="#contact" className="hover:text-blue-600 transition">Contact Us</a>
                <span>|</span>
                <a href="#privacy" className="hover:text-blue-600 transition">Privacy Policy</a>
                <span>|</span>
                <a href="#terms" className="hover:text-blue-600 transition">Terms & Conditions</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default CoordinatorLayout;
