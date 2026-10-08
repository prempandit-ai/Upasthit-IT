import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { getEvents, getFacultyList, mapFacultyToEvent } from '../../../services/coordinatorService';
import {
  ArrowsRightLeftIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const FacultyMappingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Attendance Tracking');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, facs] = await Promise.all([getEvents(), getFacultyList()]);
      setEvents(evts);
      setFacultyList(facs);
      if (evts.length > 0 && !selectedEventId) {
        setSelectedEventId(evts[0].id);
      }
      if (facs.length > 0) {
        setSelectedFacultyId(facs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentEvent = events.find((e) => e.id === selectedEventId);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedFacultyId) {
      showToast('Please select both an event and a faculty member', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await mapFacultyToEvent({
        eventId: selectedEventId,
        facultyId: selectedFacultyId,
        responsibility: selectedRole,
      });
      showToast('Faculty mapping updated successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to map faculty', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Faculty to Event Duty Mapping"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Faculty', href: '/dashboard/coordinator/faculty' },
          { label: 'Faculty Mapping' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Assign Role (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleAssign} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-4 w-4 text-blue-600" />
              Assign Faculty Duty
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                1. Select Target Event <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.startDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                2. Select Faculty Member <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.department} ({f.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                3. Responsibility / Role <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Attendance Tracking">Attendance Tracking (Mark / Verify)</option>
                <option value="Event In-charge">Event In-charge (Overall Coordinator)</option>
                <option value="Registration Desk">Registration Desk (Roster & Entry)</option>
                <option value="Discipline & Safety">Discipline & Safety</option>
                <option value="Technical Support">Technical & Lab Support</option>
                <option value="Venue Management">Venue & Logistics Management</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{submitting ? 'Mapping...' : 'Confirm Faculty Mapping'}</span>
              </button>
            </div>
          </form>

          {/* Guidelines Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900">Attendance Permission Note</h4>
            <p>
              Assigning faculty to <strong>Attendance Tracking</strong> grants them permission in their Faculty Web & Mobile app to mark and submit live session attendance for this event.
            </p>
          </div>
        </div>

        {/* Right: Current Event Mapping Matrix (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Current Event Roster
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {currentEvent?.name || 'Selected Event'}
                </h3>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                {currentEvent?.assignedFaculty?.length || 0} Faculty Assigned
              </span>
            </div>

            {currentEvent?.assignedFaculty && currentEvent.assignedFaculty.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {currentEvent.assignedFaculty.map((af, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs">
                        {af.name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{af.name}</p>
                        <p className="text-[11px] text-slate-400">{af.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {af.responsibility}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <AcademicCapIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No faculty members assigned yet</p>
                <p className="mt-0.5">Use the form on the left to assign faculty responsibilities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyMappingPage;
