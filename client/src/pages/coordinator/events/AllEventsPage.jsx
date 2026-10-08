import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import FilterBar from '../../../components/shared/FilterBar';
import EventCard from '../../../components/coordinator/EventCard';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import DetailsDrawer from '../../../components/shared/DetailsDrawer';
import { getEvents } from '../../../services/coordinatorService';
import {
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const AllEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [statusFilter, typeFilter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents({
        status: statusFilter,
        type: typeFilter,
        search,
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadEvents();
  };

  const filteredEvents = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q)
    );
  });

  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.status === 'Upcoming').length;
  const completedEvents = events.filter((e) => e.status === 'Completed').length;
  const totalRegistrations = events.reduce((acc, e) => acc + (e.registeredCount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Event Management"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Events' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition ${
                  viewMode === 'grid'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-md p-1.5 transition ${
                  viewMode === 'table'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List / Table View"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/events/create')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Event</span>
            </button>
          </div>
        }
      />

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalEvents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Upcoming</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{upcomingEvents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{completedEvents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Registrations</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{totalRegistrations}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search event name, department, venue..."
        filters={[
          {
            key: 'type',
            label: 'Event Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'All Types', value: 'All' },
              { label: 'Conference', value: 'Conference' },
              { label: 'Workshop', value: 'Workshop' },
              { label: 'Competition', value: 'Competition' },
              { label: 'Sports', value: 'Sports' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'All' },
              { label: 'Upcoming', value: 'Upcoming' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Draft', value: 'Draft' },
            ],
          },
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('All');
          setTypeFilter('All');
        }}
      />

      {/* Events View (Grid or Table) */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Try adjusting your search criteria or create a brand new event."
          actionText="Create Event"
          onAction={() => navigate('/dashboard/coordinator/events/create')}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onView={(e) => setSelectedEvent(e)}
              onMapFaculty={(e) => navigate(`/dashboard/coordinator/faculty/mapping?eventId=${e.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3">Type & Department</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Registrations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{evt.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{evt.id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800">{evt.type}</span>
                      <p className="text-[11px] text-slate-500">{evt.department}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-700">{evt.startDate}</span>
                      <p className="text-[11px] text-slate-400">{evt.startTime}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{evt.venue || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">
                        {evt.registeredCount || 0} / {evt.maxParticipants || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={evt.status} size="xs" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/coordinator/faculty/mapping?eventId=${evt.id}`)}
                          className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          Map
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      <DetailsDrawer
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.name || 'Event Details'}
        subtitle={selectedEvent?.id}
        footer={
          <div className="flex items-center justify-between gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                navigate(`/dashboard/coordinator/participants?eventId=${selectedEvent?.id}`);
                setSelectedEvent(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              View Roster ({selectedEvent?.registeredCount || 0})
            </button>
            <button
              type="button"
              onClick={() => {
                navigate(`/dashboard/coordinator/faculty/mapping?eventId=${selectedEvent?.id}`);
                setSelectedEvent(null);
              }}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Map Faculty & Roles
            </button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-5">
            {selectedEvent.banner && (
              <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={selectedEvent.banner}
                  alt={selectedEvent.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {selectedEvent.type}
                </span>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2">{selectedEvent.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                {selectedEvent.description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-900">{selectedEvent.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-semibold text-slate-900">
                  {selectedEvent.startDate} • {selectedEvent.startTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Venue</span>
                <span className="font-semibold text-slate-900">{selectedEvent.venue || 'TBD'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registration Cap</span>
                <span className="font-semibold text-slate-900">
                  {selectedEvent.registeredCount || 0} / {selectedEvent.maxParticipants} max
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Assigned Faculty Members
              </h4>
              {selectedEvent.assignedFaculty && selectedEvent.assignedFaculty.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvent.assignedFaculty.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{f.name}</p>
                        <p className="text-[11px] text-slate-500">{f.department}</p>
                      </div>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                        {f.responsibility}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">No faculty mapped to this event yet.</p>
              )}
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
};

export default AllEventsPage;
