import { useState } from 'react';
import { BookOpenIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../../components/faculty/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';

const StudyPlanPage = () => {
  const { showToast } = useToast();
  const [subject, setSubject] = useState('Database Management Systems');
  const [semester, setSemester] = useState('Semester 3');
  const [academicYear, setAcademicYear] = useState('2025-26');

  const handleUpload = (e) => {
    e.preventDefault();
    showToast('Study plan uploaded for HOD review', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Study Plan"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard/faculty' },
          { label: 'Study Plan' },
          { label: 'Upload Study Plan' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upload Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Upload Course Study Plan</h2>
          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Subject / Course</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
              >
                <option>Database Management Systems</option>
                <option>Data Structures &amp; Algorithms</option>
                <option>Operating Systems</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
                >
                  <option>Semester 3</option>
                  <option>Semester 5</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Syllabus File (PDF / DOCX)</label>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                <ArrowUpTrayIcon className="h-8 w-8 text-slate-400 mb-2" />
                <span className="font-medium text-slate-700">Choose file or drag here</span>
                <span className="text-[11px] text-slate-400 mt-1">PDF or Word document up to 15MB</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 transition"
            >
              Submit Plan for Approval
            </button>
          </form>
        </div>

        {/* Previous Plans */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Previous Approved Plans</h2>
          <div className="space-y-3">
            {[
              { subject: 'Database Management Systems', sem: 'Sem 3 (2024-25)', status: 'Approved', file: 'DBMS_Syllabus_2024.pdf' },
              { subject: 'Operating Systems', sem: 'Sem 4 (2024-25)', status: 'Approved', file: 'OS_Plan_2024.pdf' },
              { subject: 'Data Structures', sem: 'Sem 2 (2023-24)', status: 'Archived', file: 'DSA_Plan_2023.pdf' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <DocumentTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-xs">{p.subject}</p>
                    <p className="text-[11px] text-slate-500">{p.sem}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanPage;
