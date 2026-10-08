import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { getEvents } from '../../../services/coordinatorService';
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const EligibilityPage = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [saving, setSaving] = useState(false);

  const [rules, setRules] = useState({
    minAttendancePercent: 75,
    minCgpa: 6.5,
    allowedDepartments: ['Computer Engineering', 'Information Technology', 'AI & Data Science'],
    allowedYears: ['TE (Third Year)', 'BE (Final Year)'],
    requiresHODApproval: false,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeptToggle = (dept) => {
    setRules((prev) => {
      const exists = prev.allowedDepartments.includes(dept);
      return {
        ...prev,
        allowedDepartments: exists
          ? prev.allowedDepartments.filter((d) => d !== dept)
          : [...prev.allowedDepartments, dept],
      };
    });
  };

  const handleYearToggle = (year) => {
    setRules((prev) => {
      const exists = prev.allowedYears.includes(year);
      return {
        ...prev,
        allowedYears: exists
          ? prev.allowedYears.filter((y) => y !== year)
          : [...prev.allowedYears, year],
      };
    });
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Eligibility criteria saved and enforced for registrations', 'success');
    }, 400);
  };

  const allDepts = [
    'Computer Engineering',
    'Information Technology',
    'AI & Data Science',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electronics & Telecommunication',
  ];

  const allYears = [
    'FE (First Year)',
    'SE (Second Year)',
    'TE (Third Year)',
    'BE (Final Year)',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader
        title="Event Eligibility & Participation Rules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Eligibility' },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Target Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.department})
              </option>
            ))}
          </select>
        </div>

        {/* Allowed Departments */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-900">
            Eligible Academic Departments
          </label>
          <p className="text-xs text-slate-500">
            Only students belonging to checked departments will be allowed to register.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {allDepts.map((d) => {
              const checked = rules.allowedDepartments.includes(d);
              return (
                <label
                  key={d}
                  onClick={() => handleDeptToggle(d)}
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs font-medium cursor-pointer transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>{d}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Allowed Years */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-900">
            Eligible Academic Years
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {allYears.map((y) => {
              const checked = rules.allowedYears.includes(y);
              return (
                <label
                  key={y}
                  onClick={() => handleYearToggle(y)}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium cursor-pointer transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>{y}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Academic Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Minimum Academic Attendance Required (%)
            </label>
            <input
              type="number"
              value={rules.minAttendancePercent}
              onChange={(e) =>
                setRules((prev) => ({ ...prev, minAttendancePercent: e.target.value }))
              }
              min={0}
              max={100}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Minimum CGPA / Pointer
            </label>
            <input
              type="number"
              step="0.1"
              value={rules.minCgpa}
              onChange={(e) =>
                setRules((prev) => ({ ...prev, minCgpa: e.target.value }))
              }
              min={0}
              max={10}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Enforce Eligibility Rules'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityPage;
