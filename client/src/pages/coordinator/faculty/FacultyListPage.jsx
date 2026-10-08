import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import FilterBar from '../../../components/shared/FilterBar';
import FacultyMappingCard from '../../../components/coordinator/FacultyMappingCard';
import ConfirmModal from '../../../components/shared/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { getFacultyList, getEvents, mapFacultyToEvent } from '../../../services/coordinatorService';
import {
  UserPlusIcon,
  ArrowsRightLeftIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const FacultyListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [facultyList, setFacultyList] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Mapping Modal State
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [targetFaculty, setTargetFaculty] = useState(null);
  const [targetEventId, setTargetEventId] = useState('');
  const [targetResponsibility, setTargetResponsibility] = useState('Attendance Tracking');
  const [savingMapping, setSavingMapping] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDept]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [facData, evtsData] = await Promise.all([
        getFacultyList({ search }),
        getEvents(),
      ]);
      setFacultyList(facData);
      setEvents(evtsData);
      if (evtsData.length > 0) {
        setTargetEventId(evtsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaculty = facultyList.filter((f) => {
    if (selectedDept !== 'All' && f.department !== selectedDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.employeeId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenMapping = (fac) => {
    setTargetFaculty(fac);
    setMappingModalOpen(true);
  };

  const handleSaveMapping = async () => {
    if (!targetFaculty || !targetEventId) return;

    setSavingMapping(true);
    try {
      await mapFacultyToEvent({
        eventId: targetEventId,
        facultyId: targetFaculty.id,
        responsibility: targetResponsibility,
      });
      showToast(
        `Assigned ${targetFaculty.name} to event as ${targetResponsibility}`,
        'success'
      );
      setMappingModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Failed to save faculty mapping', 'error');
    } finally {
      setSavingMapping(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Faculty Management & Roster"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Faculty' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/faculty/mapping')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowsRightLeftIcon className="h-4 w-4 text-slate-500" />
              <span>Full Mapping Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/faculty/add')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Add Faculty</span>
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={loadData}
        searchPlaceholder="Search faculty name, department, employee ID..."
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
              { label: 'Applied Sciences', value: 'Applied Sciences' },
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setSelectedDept('All');
        }}
      />

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((fac) => (
          <FacultyMappingCard
            key={fac.id}
            faculty={fac}
            onAssignMapping={handleOpenMapping}
          />
        ))}
      </div>

      {/* Quick Mapping Modal */}
      {mappingModalOpen && targetFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Faculty Duty Assignment
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Map {targetFaculty.name}
              </h3>
              <p className="text-xs text-slate-500">{targetFaculty.department}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Event <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.startDate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role / Responsibility <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetResponsibility}
                  onChange={(e) => setTargetResponsibility(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="Attendance Tracking">Attendance Tracking</option>
                  <option value="Event In-charge">Event In-charge</option>
                  <option value="Registration Desk">Registration Desk</option>
                  <option value="Discipline & Safety">Discipline & Safety</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Venue Management">Venue Management</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMappingModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMapping}
                onClick={handleSaveMapping}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                {savingMapping ? 'Saving...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyListPage;
