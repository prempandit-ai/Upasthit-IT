import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { bulkImportParticipants, getEvents } from '../../../services/coordinatorService';
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const SAMPLE_CSV = `studentId,name,email,department,year,division
STU-2023-501,Aditya Deshmukh,aditya.d@college.edu,Computer Engineering,TE (Third Year),Division A
STU-2023-502,Shruti Shinde,shruti.s@college.edu,Information Technology,TE (Third Year),Division B
STU-2023-503,Manish Nair,manish.n@college.edu,AI & Data Science,SE (Second Year),Division A
STU-2023-504,Aniket More,aniket.m@college.edu,Computer Engineering,BE (Final Year),Division B`;

const ImportParticipantsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleParse = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        showToast('Please provide at least a header row and one data row', 'warning');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = parts[idx] || '';
          });
          rows.push({
            studentId: rowObj.studentid || `STU-${i + 100}`,
            name: rowObj.name || `Student ${i}`,
            email: rowObj.email || '',
            department: rowObj.department || 'Computer Engineering',
            year: rowObj.year || 'TE (Third Year)',
            division: rowObj.division || 'Division A',
          });
        }
      }

      setParsedRows(rows);
      showToast(`Parsed ${rows.length} participants successfully`, 'success');
    } catch (e) {
      showToast('Error parsing CSV. Please check formatting.', 'error');
    }
  };

  const handleDownloadSample = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + SAMPLE_CSV;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'upasthit_participants_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template downloaded', 'info');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCsvText(evt.target.result);
        showToast(`Loaded ${file.name}`, 'info');
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      showToast('Please parse the CSV first', 'warning');
      return;
    }

    const currentEvent = events.find((e) => e.id === selectedEventId);
    setImporting(true);

    try {
      const payload = parsedRows.map((p) => ({
        ...p,
        eventId: selectedEventId,
        event: currentEvent?.name || 'Selected Event',
      }));

      await bulkImportParticipants(payload);
      showToast(`${payload.length} students imported into ${currentEvent?.name}`, 'success');
      navigate('/dashboard/coordinator/participants');
    } catch (err) {
      showToast('Failed to complete bulk import', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Import Participant Roster"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/coordinator' },
          { label: 'Participants', href: '/dashboard/coordinator/participants' },
          { label: 'Bulk Import' },
        ]}
        actions={
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
            <span>Download CSV Template</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input / File (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Select Destination Event
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                2. CSV Data or File
              </h3>
              <label className="cursor-pointer rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste / Edit Raw CSV Data
              </label>
              <textarea
                rows={9}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full font-mono rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleParse}
              className="w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              Parse and Preview Data
            </button>
          </div>
        </div>

        {/* Right: Preview & Execution (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  3. Parsed Records ({parsedRows.length})
                </h3>
                {parsedRows.length > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircleIcon className="h-4 w-4" /> Ready to Import
                  </span>
                )}
              </div>

              {parsedRows.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-400">
                  <DocumentTextIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No records parsed yet</p>
                  <p className="mt-0.5">Click "Parse and Preview Data" on the left to validate records.</p>
                </div>
              ) : (
                <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-mono font-medium text-slate-900">{r.studentId}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{r.name}</td>
                          <td className="px-3 py-2 text-slate-600">{r.department}</td>
                          <td className="px-3 py-2 text-slate-600">{r.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={importing || parsedRows.length === 0}
                onClick={handleExecuteImport}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                <span>
                  {importing
                    ? 'Importing...'
                    : `Confirm and Import ${parsedRows.length} Participants`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportParticipantsPage;
