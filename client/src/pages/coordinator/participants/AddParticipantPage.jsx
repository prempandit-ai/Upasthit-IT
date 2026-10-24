import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { addParticipant, getEvents } from '../../../services/coordinatorService';
import { IdentificationIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const AddParticipantPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getEvents()
      .then((rows) => {
        if (!active) return;
        setEvents(rows);
        if (rows.length) setEventId(String(rows[0].id));
      })
      .catch((loadError) => { if (active) setError(loadError?.response?.data?.message || loadError?.message || 'Unable to load events.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!eventId || !studentId.trim()) return;
    setSubmitting(true);
    try {
      await addParticipant({ eventId, studentId: studentId.trim() });
      showToast('Registration confirmed by the server.', 'success');
      navigate(`/dashboard/coordinator/participants?eventId=${eventId}`);
    } catch (submitError) {
      showToast(submitError?.response?.data?.message || submitError?.message || 'Registration could not be completed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <PageHeader title="Add Participant" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/coordinator' }, { label: 'Participants', href: '/dashboard/coordinator/participants' }, { label: 'Add Participant' }]} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3"><IdentificationIcon className="h-5 w-5 text-blue-600" /><div><h2 className="text-sm font-bold text-slate-900">Existing student record</h2><p className="text-xs text-slate-500">Student identity and academic eligibility are checked on the server.</p></div></div>
        <label className="block text-xs font-semibold text-slate-700">Student ID / GR number<input required value={studentId} onChange={(event) => setStudentId(event.target.value)} autoComplete="off" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm" placeholder="Enter an existing student ID" /></label>
        <label className="block text-xs font-semibold text-slate-700">Event<select required value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={loading || events.length === 0} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">{loading ? 'Loading events…' : events.length ? 'Choose an event' : 'No events available'}</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="flex justify-end gap-3"><button type="button" onClick={() => navigate('/dashboard/coordinator/participants')} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">Cancel</button><button type="submit" disabled={submitting || loading || !events.length} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"><UserPlusIcon className="h-4 w-4" />{submitting ? 'Registering…' : 'Register Existing Student'}</button></div>
      </form>
    </div>
  );
};

export default AddParticipantPage;
