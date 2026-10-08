import React from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from '../shared/StatusBadge';

/**
 * EventCard component for Events list and dashboard views.
 */
const EventCard = ({
  event,
  onView,
  onMapFaculty,
  className = '',
}) => {
  const percentFilled = Math.min(
    100,
    Math.round(((event.registeredCount || 0) / (event.maxParticipants || 100)) * 100)
  );

  return (
    <div className={`flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:shadow-sm hover:border-slate-300 ${className}`}>
      {/* Top Banner image if available */}
      {event.banner && (
        <div className="relative h-32 w-full overflow-hidden bg-slate-900">
          <img
            src={event.banner}
            alt={event.name}
            className="h-full w-full object-cover opacity-85 transition hover:scale-105"
          />
          <div className="absolute top-2.5 right-2.5 flex gap-1.5">
            <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-800 backdrop-blur-xs">
              {event.type}
            </span>
            <StatusBadge status={event.status} size="xs" />
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{event.name}</h3>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Details strip */}
          <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.startDate} • {event.startTime}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
            )}
          </div>

          {/* Registration Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Registrations</span>
              <span className="font-bold text-slate-900">
                {event.registeredCount || 0} / {event.maxParticipants || '—'} ({percentFilled}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentFilled >= 90 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>

          {/* Assigned Faculty Tags */}
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
              <AcademicCapIcon className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-semibold text-slate-700">Assigned Faculty:</span>
            </div>
            {event.assignedFaculty && event.assignedFaculty.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {event.assignedFaculty.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700"
                  >
                    <span className="font-semibold text-slate-900 mr-1">{f.name}:</span>
                    <span className="text-blue-700">{f.responsibility}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-amber-600 italic">No faculty assigned yet</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {onMapFaculty && (
            <button
              type="button"
              onClick={() => onMapFaculty(event)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Faculty Mapping
            </button>
          )}

          {onView && (
            <button
              type="button"
              onClick={() => onView(event)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition ml-auto"
            >
              <span>View Details</span>
              <ArrowRightIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
