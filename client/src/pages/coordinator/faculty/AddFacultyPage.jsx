import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import {
  UserPlusIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const AddFacultyPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: 'Computer Engineering',
    designation: 'Assistant Professor',
    responsibility: 'Attendance Tracking',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId.trim() || !form.name.trim() || !form.email.trim()) {
      showToast('Please fill in required fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate adding faculty
      showToast(`Faculty member ${form.name} added successfully!`, 'success');
      navigate('/dashboard/coordinator/faculty');
    } catch (err) {
      showToast('Failed to add faculty member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader
        title="Add Faculty Coordinator"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Faculty', href: '/dashboard/coordinator/faculty' },
          { label: 'Add Faculty' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <IdentificationIcon className="h-4 w-4 text-blue-600" />
            Faculty Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="e.g. EMP-CSE-109"
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
                placeholder="e.g. Dr. Rajesh Kulkarni"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="rajesh.k@college.edu"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98230 00000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
            Department & Designation
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <option value="Applied Sciences">Applied Sciences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Designation
              </label>
              <select
                name="designation"
                value={form.designation}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Duty Role
              </label>
              <select
                name="responsibility"
                value={form.responsibility}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="Attendance Tracking">Attendance Tracking</option>
                <option value="Event In-charge">Event In-charge</option>
                <option value="Registration Desk">Registration Desk</option>
                <option value="Discipline & Safety">Discipline & Safety</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/coordinator/faculty')}
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
            <span>{submitting ? 'Adding...' : 'Add Faculty Member'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFacultyPage;
