import React from 'react';
import { AcademicCapIcon, BriefcaseIcon, BuildingOfficeIcon, PhoneIcon } from '@heroicons/react/24/outline';

/**
 * FacultyMappingCard component:
 * Displays faculty credentials, department, and mapped responsibilities.
 */
const FacultyMappingCard = ({
  faculty,
  onAssignMapping,
  className = '',
}) => {
  return (
    <div className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:shadow-sm ${className}`}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-xs">
              {faculty.name?.charAt(0) || 'F'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{faculty.name}</h4>
              <p className="text-[11px] font-medium text-blue-700">{faculty.designation}</p>
            </div>
          </div>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
            {faculty.employeeId}
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{faculty.department}</span>
          </div>
          {faculty.phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{faculty.phone}</span>
            </div>
          )}
        </div>

        {/* Assigned Responsibility */}
        <div className="mt-3.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 font-medium">Assigned Role:</span>
            <span className="font-bold text-slate-900">
              {faculty.responsibility || 'Unassigned'}
            </span>
          </div>
          <div className="text-[11px] text-slate-600">
            <span className="font-medium text-slate-500">Mapped Events: </span>
            {faculty.mappedEvents && faculty.mappedEvents.length > 0 ? (
              <span className="text-slate-800 font-semibold">
                {faculty.mappedEvents.join(', ')}
              </span>
            ) : (
              <span className="text-amber-600 italic">None</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onAssignMapping && onAssignMapping(faculty)}
          className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
        >
          Assign / Update Mapping
        </button>
      </div>
    </div>
  );
};

export default FacultyMappingCard;
