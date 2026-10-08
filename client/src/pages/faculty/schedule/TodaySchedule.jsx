import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, PlusIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import StatusBadge from '../../../components/faculty/shared/StatusBadge';

const TODAY_CLASSES = [
  { id: '1', time: '09:00 AM - 10:00 AM', subject: 'Data Structures', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 305', status: 'Completed', present: 52, total: 58 },
  { id: '2', time: '11:00 AM - 12:00 PM', subject: 'DBMS', type: 'Lecture', batch: 'B.Tech CSE Sem 3', room: 'Room 310', status: 'Ongoing', present: null, total: 58 },
  { id: '3', time: '02:00 PM - 05:00 PM', subject: 'DBMS Lab', type: 'Lab', batch: 'B.Tech CSE Sem 3', room: 'Lab 1', status: 'Upcoming', present: null, total: 28 },
];

const TodaySchedule = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Today's Schedule"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Schedule', href: '/dashboard/faculty/schedule/manage' },
          { label: "Today's Schedule" },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/dashboard/faculty/attendance/take')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Take Attendance
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Classes Today</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Lectures / Labs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">2 / 1</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Teaching Hours</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">5 Hrs</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Scheduled Sessions for Today</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Batch / Section</th>
                <th className="px-4 py-3">Room / Venue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TODAY_CLASSES.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">{c.time}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.subject}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.type} /></td>
                  <td className="px-4 py-3 text-slate-600">{c.batch}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{c.room}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard/faculty/attendance/take')}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Take Attendance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TodaySchedule;
