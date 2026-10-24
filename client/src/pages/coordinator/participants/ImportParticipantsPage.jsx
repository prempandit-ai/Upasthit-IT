import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/shared/PageHeader';
import { useToast } from '../../../context/ToastContext';
import { bulkImportParticipants, getEvents } from '../../../services/coordinatorService';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const CSV_TEMPLATE = 'studentId\n';

function parseCsvRow(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { fields.push(field.trim()); field = ''; }
    else field += char;
  }
  fields.push(field.trim());
  return fields;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

const ImportParticipantsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [csvText, setCsvText] = useState(CSV_TEMPLATE);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [pageError, setPageError] = useState('');
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    let active = true;
    getEvents()
      .then((rows) => {
        if (!active) return;
        setEvents(rows);
        if (rows.length) setSelectedEventId(String(rows[0].id));
      })
      .catch((error) => { if (active) setPageError(getErrorMessage(error, 'Unable to load events.')); })
      .finally(() => { if (active) setLoadingEvents(false); });
    return () => { active = false; };
  }, []);

  const handleParse = () => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      showToast('Add a header and at least one existing student ID.', 'warning');
      return;
    }
    const headers = parseCsvRow(lines[0]).map((value) => value.toLowerCase());
    const studentIdColumn = headers.indexOf('studentid');
    if (studentIdColumn < 0) {
      showToast('CSV must contain a studentId column.', 'error');
      return;
    }
    const rows = lines.slice(1).map((line) => parseCsvRow(line)[studentIdColumn]?.trim()).filter(Boolean);
    if (!rows.length) {
      showToast('No student IDs were found in the CSV.', 'warning');
      return;
    }
    const duplicateIds = rows.filter((id, index) => rows.indexOf(id) !== index);
    if (duplicateIds.length) {
      showToast(`Remove duplicate student IDs before importing: ${[...new Set(duplicateIds)].join(', ')}`, 'error');
      return;
    }
    setParsedRows(rows.map((studentId) => ({ studentId })));
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;
    link.download = 'upasthit_existing_student_ids.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
      setParsedRows([]);
      setImportResult(null);
    };
    reader.onerror = () => showToast('Could not read this CSV file.', 'error');
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedEventId || !parsedRows.length) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await bulkImportParticipants(parsedRows.map(({ studentId }) => ({ studentId, eventId: selectedEventId })));
      const importedCount = Number(result.importedCount || 0);
      const conflicts = Array.isArray(result.conflicts) ? result.conflicts : [];
      setImportResult({ importedCount, conflicts });
      showToast(`${importedCount} registrations confirmed by the server${conflicts.length ? `; ${conflicts.length} conflicts` : ''}.`, conflicts.length ? 'warning' : 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Registration import failed.'), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Import Participant Roster"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/coordinator' }, { label: 'Participants', href: '/dashboard/coordinator/participants' }, { label: 'Bulk Import' }]}
        actions={<button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowDownTrayIcon className="h-4 w-4" />Download CSV Template</button>}
      />

      {pageError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{pageError}</p>}
      {importResult && <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm"><p className="font-semibold text-slate-900">Server result: {importResult.importedCount} registered.</p>{importResult.conflicts.length > 0 && <ul className="mt-2 list-disc pl-5 text-amber-800">{importResult.conflicts.map((item, index) => <li key={`${item.studentId}-${index}`}>{item.studentId}: {item.reason}</li>)}</ul>}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">1. Select Event</h2>
          <select value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} disabled={loadingEvents || !events.length} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">{loadingEvents ? 'Loading events…' : events.length ? 'Choose an event' : 'No events available'}</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <div>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-slate-900">2. Existing student IDs</h2><label className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold">Choose CSV<input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" /></label></div>
            <p className="mb-2 text-xs text-slate-500">Only existing approved student records are registered. Names and academic data are read from the student profile.</p>
            <textarea rows={10} value={csvText} onChange={(event) => setCsvText(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3 font-mono text-xs" aria-label="Student ID CSV" />
            <button type="button" onClick={handleParse} className="mt-3 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white">Parse and Preview IDs</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">3. Preview ({parsedRows.length})</h2>
          {!parsedRows.length ? <div className="py-16 text-center text-xs text-slate-500"><DocumentTextIcon className="mx-auto mb-2 h-9 w-9 text-slate-300" />Paste a CSV with a studentId header and parse it.</div> : <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr><th className="px-3 py-2">Existing Student ID</th></tr></thead><tbody className="divide-y divide-slate-100">{parsedRows.map((row) => <tr key={row.studentId}><td className="px-3 py-2 font-mono">{row.studentId}</td></tr>)}</tbody></table></div>}
          <button type="button" disabled={importing || !parsedRows.length || !selectedEventId} onClick={handleImport} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white disabled:opacity-50"><ArrowUpTrayIcon className="h-4 w-4" />{importing ? 'Registering…' : `Register ${parsedRows.length} IDs`}</button>
          <button type="button" onClick={() => navigate('/dashboard/coordinator/participants')} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700">Return to roster</button>
        </section>
      </div>
    </div>
  );
};

export default ImportParticipantsPage;
