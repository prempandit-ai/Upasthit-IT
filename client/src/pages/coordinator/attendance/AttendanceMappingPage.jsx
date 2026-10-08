import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import FilterBar from '../../../components/shared/FilterBar';
import StatusBadge from '../../../components/shared/StatusBadge';
import { getEvents } from '../../../services/coordinatorService';
import {
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const AttendanceMappingPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadEvents();
  }, [selectedDept]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents({ search });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedDept !== 'All' && e.department !== selectedDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Attendance Tracking & Faculty Mapping"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Attendance Mapping' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/faculty/mapping')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            <span>Map Faculty Duty</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={loadEvents}
        searchPlaceholder="Search event or department..."
        filters={[
          {
            key: 'department',
            label: 'Department',
            value: selectedDept,
            onChange: setSelectedDept,
            options: [
              { label: 'All Departments', value: 'All' },
              { label: 'Computer Engineering', value: 'Computer Engineering' },
              { label: 'Information Technology', value: 'Information Technology' },
              { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
              { label: 'Civil Engineering', value: 'Civil Engineering' },
              { label: 'AI & Data Science', value: 'AI & Data Science' },
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setSelectedDept('All');
        }}
      />

      {/* Attendance Mapping Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Event Details</th>
                <th className="px-4 py-3">Host Department</th>
                <th className="px-4 py-3">Assigned Attendance Faculty</th>
                <th className="px-4 py-3">Roster Capacity</th>
                <th className="px-4 py-3">Attendance Progress</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((evt) => {
                const attendanceFaculty = evt.assignedFaculty?.filter(
                  (f) => f.responsibility?.toLowerCase().includes('attendance') || f.responsibility?.toLowerCase().includes('in-charge')
                ) || [];

                return (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{evt.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {evt.startDate} • {evt.startTime}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {evt.department}
                    </td>

                    <td className="px-4 py-3.5">
                      {attendanceFaculty.length > 0 ? (
                        <div className="space-y-1">
                          {attendanceFaculty.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <AcademicCapIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="font-semibold text-slate-800">{f.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({f.responsibility})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium italic">
                          No faculty mapped
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{evt.registeredCount}</span>
                      <span className="text-slate-400"> / {evt.maxParticipants}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${evt.attendanceStats?.rate || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {evt.attendanceStats?.rate || 0}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/coordinator/faculty/mapping?eventId=${evt.id}`)}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                      >
                        Update Faculty
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMappingPage;
