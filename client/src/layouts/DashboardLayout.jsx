import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import useAuth from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";

const DashboardLayout = () => {
  const { user, logout, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully", "success");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        dashboardPath={dashboardPath}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar
          user={user}
          onToggleSidebar={() => setSidebarOpen((current) => !current)}
        />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
