import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { addParticipant, getEvents } from '../../../services/coordinatorService';
import {
  UserPlusIcon,
  IdentificationIcon,
  AcademicCapIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const AddParticipantPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'Computer Engineering',
    year: 'TE (Third Year)',
    division: 'Division A',
    eventId: '',
    event: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      if (data.length > 0) {
        setForm((prev) => ({
          ...prev,
          eventId: data[0].id,
          event: data[0].name,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'eventId') {
      const found = events.find((ev) => ev.id === value);
      setForm((prev) => ({
        ...prev,
        eventId: value,
        event: found?.name || '',
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId.trim() || !form.name.trim() || !form.email.trim()) {
      showToast('Please fill in all mandatory fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await addParticipant(form);
      showToast('Student successfully added to event roster', 'success');
      navigate('/dashboard/coordinator/participants');
    } catch (err) {
      showToast('Failed to add participant', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader
        title="Add Single Participant"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Participants', href: '/dashboard/coordinator/participants' },
          { label: 'Add Participant' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <IdentificationIcon className="h-4 w-4 text-blue-600" />
            Student Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student ID / Roll No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                placeholder="e.g. STU-2023-010"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="aarav.s@college.edu"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <AcademicCapIcon className="h-4 w-4 text-blue-600" />
            Academic & Event Assignment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="AI & Data Science">AI & Data Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Year
              </label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="FE (First Year)">FE (First Year)</option>
                <option value="SE (Second Year)">SE (Second Year)</option>
                <option value="TE (Third Year)">TE (Third Year)</option>
                <option value="BE (Final Year)">BE (Final Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Class Division
              </label>
              <select
                name="division"
                value={form.division}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Division A">Division A</option>
                <option value="Division B">Division B</option>
                <option value="Division C">Division C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Event <span className="text-red-500">*</span>
              </label>
              <select
                name="eventId"
                value={form.eventId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 font-semibold"
                required
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/participants')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span>{submitting ? 'Registering...' : 'Register Participant'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddParticipantPage;
