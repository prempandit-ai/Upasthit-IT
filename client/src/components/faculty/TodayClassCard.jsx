import { useNavigate } from 'react-router-dom';
import { ClockIcon, MapPinIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  UPCOMING: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PENDING: { label: 'Attendance Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SUBMITTED: { label: 'Attendance Submitted', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  COMPLETED: { label: 'Completed', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

const StatusBadge = ({ status = 'UPCOMING' }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.UPCOMING;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

/**
 * TodayClassCard
 *
 * Props:
 *   id            — timetable entry ID (used for attendance route)
 *   subject       — subject name
 *   startTime     — e.g. "10:00 AM"
 *   endTime       — e.g. "11:00 AM"
 *   className     — e.g. "BE Computer Engineering"
 *   semester      — e.g. "Semester VII"
 *   division      — e.g. "Division A"
 *   room          — e.g. "Room 201"
 *   status        — 'UPCOMING' | 'PENDING' | 'SUBMITTED' | 'COMPLETED'
 */
const TodayClassCard = ({
  id,
  subject = 'Subject',
  startTime = '--:--',
  endTime = '--:--',
  className = '',
  semester = '',
  division = '',
  room = '',
  status = 'UPCOMING',
}) => {
  const navigate = useNavigate();

  const canTakeAttendance = status === 'UPCOMING' || status === 'PENDING';

  const handleTakeAttendance = () => {
    // Navigate to attendance route — ready for when the route is implemented
    navigate(`/dashboard/faculty/attendance/take/${id}`);
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Status + time */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <StatusBadge status={status} />
        <span className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
          <ClockIcon className="h-3.5 w-3.5" />
          {startTime} – {endTime}
        </span>
      </div>

      {/* Subject */}
      <h3 className="text-base font-bold text-slate-900 leading-tight">{subject}</h3>

      {/* Class info */}
      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
        <AcademicCapIcon className="h-3.5 w-3.5 shrink-0" />
        <span>
          {className}
          {semester && ` • ${semester}`}
          {division && ` • ${division}`}
        </span>
      </div>

      {/* Room */}
      {room && (
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
          <span>{room}</span>
        </div>
      )}

      {/* Action button */}
      <div className="mt-4">
        {canTakeAttendance ? (
          <button
            type="button"
            onClick={handleTakeAttendance}
            className="w-full rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 active:bg-blue-900"
          >
            Take Attendance
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
          >
            {status === 'SUBMITTED' ? 'Attendance Submitted ✓' : 'Completed'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TodayClassCard;
