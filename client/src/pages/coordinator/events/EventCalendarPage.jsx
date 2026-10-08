import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import StatusBadge from '../../../components/shared/StatusBadge';
import { getEvents } from '../../../services/coordinatorService';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const EventCalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // May 2025 default to match sample data
  const [selectedDateStr, setSelectedDateStr] = useState('2025-05-25');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedD = d < 10 ? `0${d}` : `${d}`;
    const formattedM = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${year}-${formattedM}-${formattedD}`;
    daysArray.push({ dayNumber: d, dateStr });
  }

  const selectedDayEvents = events.filter((e) => e.startDate === selectedDateStr);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Event Calendar"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Events', href: '/dashboard/coordinator/events' },
          { label: 'Calendar' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/events/create')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Schedule Event</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 Cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          {/* Header Month Switcher */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">{monthYearStr}</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-slate-50/50 p-1" />;
              }

              const isSelected = item.dateStr === selectedDateStr;
              const dayEvents = events.filter((e) => e.startDate === item.dateStr);

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedDateStr(item.dateStr)}
                  className={`h-24 rounded-lg border p-1.5 text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      {item.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-800"
                        title={ev.name}
                      >
                        {ev.name}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-medium">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Event Side Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scheduled for
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {new Date(selectedDateStr).toLocaleDateString('default', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CalendarDaysIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">No events scheduled</p>
                <p className="mt-0.5">Select another date or schedule a new event.</p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/coordinator/events/create')}
                  className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Schedule Event Here
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                        {evt.type}
                      </span>
                      <StatusBadge status={evt.status} size="xs" />
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{evt.name}</h4>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{evt.startTime} - {evt.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserGroupIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{evt.registeredCount} registered</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/coordinator/events`)}
                      className="w-full mt-2 rounded bg-white border border-slate-200 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                    >
                      View Event Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendarPage;
