import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import StatCard from '../../../components/shared/StatCard';
import { useToast } from '../../../context/ToastContext';
import { getCoordinatorReports } from '../../../services/coordinatorService';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const ReportsPage = () => {
  const { showToast } = useToast();
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getCoordinatorReports();
      setReportsData(data);
    } catch (err) {
      console.error(err);
      setLoadError(err?.response?.data?.message || err?.message || 'Unable to load report records.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    showToast('Report export is unavailable because no export service is configured.', 'info');
  };
  const departmentDistribution = reportsData?.departmentDistribution || [];
  const departmentMax = Math.max(1, ...departmentDistribution.map((item) => Number(item.participants) || 0));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Event Operations & Attendance Reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Reports' },
        ]}
        actions={
          <button
            type="button"
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export Analytics</span>
          </button>
        }
      />

      {loadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}<button type="button" onClick={loadReports} className="ml-3 font-semibold underline">Retry</button></p>}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Event records"
          value={loading ? '—' : reportsData?.totalEvents ?? 0}
          subtitle="Across all recorded dates"
          icon={CalendarDaysIcon}
        />
        <StatCard
          title="Total Registrations"
          value={loading ? '—' : reportsData?.totalRegistrations ?? 0}
          subtitle="Across all departments"
          icon={UserGroupIcon}
        />
        <StatCard
          title="Average Attendance Rate"
          value="Unavailable"
          subtitle="No event attendance data"
          icon={ChartBarIcon}
        />
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Participation Breakdown (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
            Department Participation
          </h3>

          <div className="space-y-3">
            {departmentDistribution.map((dept, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{dept.department}</span>
                  <span className="font-bold text-blue-700">{dept.participants} students</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, ((Number(dept.participants) || 0) / departmentMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!reportsData?.departmentDistribution?.length ? <p className="text-xs text-slate-500">Department registration breakdown is unavailable.</p> : null}
          </div>
        </div>

        {/* Event-by-Event Breakdown Table (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4 text-blue-600" />
            Event Registrations
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Event Name</th>
                  <th className="px-3 py-2">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportsData?.eventWiseStats?.map((st, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{st.eventName}</td>
                    <td className="px-3 py-2.5 text-slate-700">{st.registered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
