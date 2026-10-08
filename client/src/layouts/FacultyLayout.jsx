import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import FacultySidebar from '../components/faculty/FacultySidebar';
import FacultyNavbar from '../components/faculty/FacultyNavbar';

/**
 * FacultyLayout
 * Wraps all /dashboard/faculty/* routes with the faculty-specific
 * sidebar and navbar. The sidebar is responsive (collapsible on mobile).
 */
const FacultyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <FacultySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <FacultyNavbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;
