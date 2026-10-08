import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

/**
 * Coordinator Profile Card matching the reference screenshot:
 * Shows avatar, name, role, email, phone, and [ View Profile ] button.
 */
const CoordinatorProfileCard = ({ className = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || 'Coordinator Name';
  const displayEmail = user?.email || 'coordinator@college.edu';
  const displayPhone = '+91 98765 43210';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs ${className}`}>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
          Coordinator Profile
        </h3>

        <div className="flex flex-col items-center text-center">
          {/* Avatar Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50 text-slate-700 shadow-inner mb-3">
            <span className="text-2xl font-black">{initial}</span>
          </div>

          <h4 className="text-base font-bold text-slate-900">{displayName}</h4>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            Event Coordinator
          </span>

          <div className="mt-3.5 space-y-1 text-xs text-slate-500">
            <div className="flex items-center justify-center gap-1.5">
              <EnvelopeIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{displayEmail}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <PhoneIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>{displayPhone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex justify-center">
        <button
          type="button"
          onClick={() => navigate('/dashboard/coordinator/profile')}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default CoordinatorProfileCard;
