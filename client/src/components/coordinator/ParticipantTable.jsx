import React from 'react';
import DataTable from '../shared/DataTable';
import StatusBadge from '../shared/StatusBadge';
import { EyeIcon } from '@heroicons/react/24/outline';

/**
 * ParticipantTable component for Participant Management:
 * Columns: Student ID, Student Name, Department, Year, Division, Event, Registration Status, Attendance Status, Actions.
 */
const ParticipantTable = ({
  participants = [],
  loading = false,
  pagination = null,
  onViewDetails,
  className = '',
}) => {
  const columns = [
    {
      key: 'studentId',
      label: 'Student ID',
      render: (val) => <span className="font-mono font-semibold text-slate-800">{val}</span>,
    },
    {
      key: 'name',
      label: 'Student Name',
      render: (val, row) => (
        <div>
          <p className="font-bold text-slate-900">{val}</p>
          <p className="text-[11px] text-slate-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span className="text-slate-600">{val}</span>,
    },
    {
      key: 'year',
      label: 'Year / Div',
      render: (val, row) => (
        <span className="text-slate-600 font-medium">
          {val} • {row.division}
        </span>
      ),
    },
    {
      key: 'event',
      label: 'Registered Event',
      render: (val) => (
        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
          {val}
        </span>
      ),
    },
    {
      key: 'registrationStatus',
      label: 'Registration',
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: 'attendanceStatus',
      label: 'Attendance',
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => onViewDetails && onViewDetails(row)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="View Participant Details"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={participants}
      loading={loading}
      pagination={pagination}
      emptyMessage="No participants found"
      emptyDescription="No participant records matching your current filter criteria."
      className={className}
    />
  );
};

export default ParticipantTable;
