import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import FilterBar from '../../../components/shared/FilterBar';
import ParticipantTable from '../../../components/coordinator/ParticipantTable';
import DetailsDrawer from '../../../components/shared/DetailsDrawer';
import StatusBadge from '../../../components/shared/StatusBadge';
import { useToast } from '../../../context/ToastContext';
import { getParticipants, getEvents } from '../../../services/coordinatorService';
import {
  UserPlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const ParticipantsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || 'All';
  const { showToast } = useToast();

  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedEventId, selectedDept]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [partsData, evtsData] = await Promise.all([
        getParticipants({
          eventId: selectedEventId,
          department: selectedDept,
          search,
        }),
        getEvents(),
      ]);
      setParticipants(partsData);
      setEvents(evtsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (participants.length === 0) {
      showToast('No participant records to export', 'warning');
      return;
    }

    const headers = ['Student ID,Name,Email,Department,Year,Division,Event,Registration Status,Attendance Status'];
    const rows = participants.map((p) =>
      `"${p.studentId}","${p.name}","${p.email}","${p.department}","${p.year}","${p.division}","${p.event}","${p.registrationStatus}","${p.attendanceStatus}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participants_roster_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Participant roster exported as CSV', 'success');
  };

  const eventOptions = [
    { label: 'All Events', value: 'All' },
    ...events.map((e) => ({ label: e.name, value: e.id })),
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Participant Roster"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Participants' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/participants/import')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowUpTrayIcon className="h-4 w-4 text-slate-500" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/coordinator/participants/add')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>Add Participant</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={loadData}
        searchPlaceholder="Search by student name, roll number, or event..."
        filters={[
          {
            key: 'event',
            label: 'Event',
            value: selectedEventId,
            onChange: setSelectedEventId,
            options: eventOptions,
          },
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
          setSelectedEventId('All');
          setSelectedDept('All');
        }}
      />

      {/* Participant Data Table */}
      <ParticipantTable
        participants={participants}
        loading={loading}
        onViewDetails={(p) => setSelectedParticipant(p)}
      />

      {/* Participant Detail Drawer */}
      <DetailsDrawer
        open={Boolean(selectedParticipant)}
        onClose={() => setSelectedParticipant(null)}
        title={selectedParticipant?.name || 'Participant Details'}
        subtitle={selectedParticipant?.studentId}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">Upasthit Registry</span>
            <button
              type="button"
              onClick={() => setSelectedParticipant(null)}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        }
      >
        {selectedParticipant && (
          <div className="space-y-5 text-xs">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registered Event</span>
                <span className="font-bold text-blue-700">{selectedParticipant.event}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800">{selectedParticipant.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Academic Year / Div</span>
                <span className="font-semibold text-slate-800">
                  {selectedParticipant.year} • {selectedParticipant.division}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Student Email</span>
                <span className="font-mono text-slate-700">{selectedParticipant.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registration Date</span>
                <span className="text-slate-700">{selectedParticipant.registeredAt}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Status & Verification
              </h4>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-slate-600 font-medium">Registration Status:</span>
                <StatusBadge status={selectedParticipant.registrationStatus} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                <span className="text-slate-600 font-medium">Event Attendance:</span>
                <StatusBadge status={selectedParticipant.attendanceStatus} />
              </div>
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
};

export default ParticipantsListPage;
