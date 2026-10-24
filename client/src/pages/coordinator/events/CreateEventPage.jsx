import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import useAuth from '../../../hooks/useAuth';
import { createEvent } from '../../../services/coordinatorService';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    type: 'Conference',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    maxParticipants: '',
    registrationStartDate: '',
    registrationDeadline: '',
    academicYear: '',
    targetYear: '',
    targetDivision: '',
    targetLabBatch: '',
    coordinator: user?.name || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (publishStatus = 'Upcoming') => {
    if (!form.name.trim()) {
      showToast('Please enter an event name', 'warning');
      return;
    }
    if (!form.startDate) {
      showToast('Please select a start date', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await createEvent({
        name: form.name, category: form.type, description: form.description,
        venue: form.venue, startDate: form.startDate, startTime: form.startTime,
        endDate: form.endDate || null, endTime: form.endTime || null,
        capacity: form.maxParticipants || null,
        registrationOpensAt: form.registrationStartDate || null,
        registrationDeadline: form.registrationDeadline || null,
        targetAcademicYear: form.academicYear || null,
        targetYear: form.targetYear || null,
        targetDivision: form.targetDivision || null,
        targetLabBatch: form.targetLabBatch || null,
        status: publishStatus,
      });
      showToast(
        publishStatus === 'Draft' ? 'Event draft saved' : 'Event published successfully!',
        'success'
      );
      navigate('/dashboard/coordinator/events');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Create New Event"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Events', href: '/dashboard/coordinator/events' },
          { label: 'Create Event' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => navigate('/dashboard/coordinator/events')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Draft')}
              className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('Upcoming')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              {submitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              General Event Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. National Hackathon 2025"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Competition">Competition</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Industrial Visit">Industrial Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Student Year</label>
                <select name="targetYear" value={form.targetYear} onChange={handleChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500">
                  <option value="">All years</option><option value="FY">FY</option><option value="SY">SY</option><option value="TY">TY</option><option value="BE">BE</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide a comprehensive description of objectives, schedule, prerequisites..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule & Venue */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
              Schedule & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Venue / Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Auditorium Hall A or Lab 204"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Registration Constraints */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-blue-600" />
              Registration & Participant Capacity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={form.maxParticipants}
                  onChange={handleChange}
                  min={1}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registration Start
                </label>
                <input
                  type="date"
                  name="registrationStartDate"
                  value={form.registrationStartDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Details (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Academic Scoping */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Academic & Operational Scope
            </h4>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                name="academicYear"
                value={form.academicYear}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Target Division
              </label>
              <select name="targetDivision" value={form.targetDivision} onChange={handleChange} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"><option value="">All divisions</option><option value="A">Division A</option><option value="B">Division B</option><option value="C">Division C</option></select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Target Lab Batch</label>
              <input type="text" name="targetLabBatch" value={form.targetLabBatch} onChange={handleChange} placeholder="Optional, for example A1" className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Lead Coordinator
              </label>
              <input
                type="text"
                name="coordinator"
                value={form.coordinator}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs bg-slate-50"
                readOnly
              />
            </div>
          </div>

          {/* Publishing Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Once published, the event becomes discoverable to eligible students across their student portal. You can map attendance faculty immediately after saving.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Upcoming')}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                {submitting ? 'Publishing...' : 'Publish Event'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('Draft')}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
