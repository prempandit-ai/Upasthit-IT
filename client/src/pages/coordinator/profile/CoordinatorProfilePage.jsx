import React, { useState } from 'react';
import PageHeader from '../../../components/shared/PageHeader';
import useAuth from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const CoordinatorProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || 'Prof. Anjali Deshmukh',
    email: user?.email || 'coordinator@college.edu',
    phone: '+91 98230 45678',
    department: user?.department || 'Computer Engineering',
    role: 'COORDINATOR',
    employeeId: 'EMP-COORD-001',
    officeLocation: 'Room 304, Academic Block A',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile information updated successfully', 'success');
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      <PageHeader
        title="My Profile"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Profile' },
        ]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 font-extrabold text-2xl text-white shadow-xs">
              {profile.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
              <p className="text-xs text-slate-500">{profile.department}</p>
              <span className="mt-1 inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                ROLE: {profile.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={profile.employeeId}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-slate-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={profile.department}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Office / Cabin Location
              </label>
              <input
                type="text"
                name="officeLocation"
                value={profile.officeLocation}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CoordinatorProfilePage;
