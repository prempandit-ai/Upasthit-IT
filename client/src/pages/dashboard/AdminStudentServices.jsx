import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  createFeeCharge, createLibraryBook, getAdminStudentFees, getLibraryBooks,
  getLibraryLoans, getLibraryPolicy, getStudentDocumentsForReview,
  issueLibraryBook, lookupStudentById, recordFeePayment, reviewStudentDocument,
  returnLibraryBook, updateLibraryPolicy,
} from '../../services/adminStudentServices';

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
const errorMessage = (error) => error?.response?.data?.message || error?.message || 'Request failed.';
const money = (value) => Number(value || 0).toFixed(2);

const AdminStudentServices = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState('fees');
  const [studentKey, setStudentKey] = useState('');
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState(null);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [policy, setPolicy] = useState({ maxActiveLoans: '0', finePerDay: '' });
  const [documents, setDocuments] = useState([]);
  const [documentStatus, setDocumentStatus] = useState('SUBMITTED');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [chargeForm, setChargeForm] = useState({ title: '', academicYear: '', amount: '', dueDate: '' });
  const [paymentForm, setPaymentForm] = useState({ chargeId: '', receiptNumber: '', amount: '', paymentMethod: '' });
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', accessionCode: '', totalCopies: '' });
  const [loanForm, setLoanForm] = useState({ bookId: '', dueAt: '' });

  const loadBooks = async () => {
    const [booksResponse, loansResponse, policyResponse] = await Promise.all([getLibraryBooks(), getLibraryLoans(), getLibraryPolicy()]);
    setBooks(booksResponse.data?.books || []);
    setLoans(loansResponse.data?.loans || []);
    const savedPolicy = policyResponse.data?.policy;
    if (savedPolicy) setPolicy({ maxActiveLoans: String(savedPolicy.maxActiveLoans), finePerDay: savedPolicy.finePerDay == null ? '' : String(savedPolicy.finePerDay) });
  };

  const loadDocuments = async (status = documentStatus) => {
    const response = await getStudentDocumentsForReview(status);
    setDocuments(response.data?.documents || []);
  };

  useEffect(() => {
    Promise.all([loadBooks(), loadDocuments()]).catch((loadError) => setError(errorMessage(loadError)));
  }, []);

  const findStudent = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setStudent(null); setFees(null);
    try {
      const response = await lookupStudentById(studentKey.trim());
      const found = response.data?.student;
      if (!found) throw new Error('Student record was not returned.');
      setStudent(found);
      setChargeForm((current) => ({ ...current, academicYear: found.academicYear || '' }));
      const feeResponse = await getAdminStudentFees(found.id);
      setFees(feeResponse.data?.fees || null);
    } catch (findError) { setError(errorMessage(findError)); }
    finally { setBusy(false); }
  };

  const submitCharge = async (event) => {
    event.preventDefault(); if (!student) return;
    setBusy(true); setError('');
    try {
      await createFeeCharge({ studentId: student.id, ...chargeForm });
      showToast('Fee charge recorded.', 'success');
      setChargeForm((current) => ({ ...current, title: '', amount: '', dueDate: '' }));
      const response = await getAdminStudentFees(student.id); setFees(response.data?.fees || null);
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setBusy(false); }
  };

  const submitPayment = async (event) => {
    event.preventDefault(); if (!student) return;
    setBusy(true); setError('');
    try {
      await recordFeePayment({ studentId: student.id, ...paymentForm, chargeId: paymentForm.chargeId || null });
      showToast('Recorded payment saved to the ledger.', 'success');
      setPaymentForm({ chargeId: '', receiptNumber: '', amount: '', paymentMethod: '' });
      const response = await getAdminStudentFees(student.id); setFees(response.data?.fees || null);
    } catch (saveError) { setError(errorMessage(saveError)); }
    finally { setBusy(false); }
  };

  const addBook = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await createLibraryBook({ ...bookForm, totalCopies: Number(bookForm.totalCopies) }); setBookForm({ title: '', author: '', isbn: '', accessionCode: '', totalCopies: '' }); await loadBooks(); showToast('Book record saved.', 'success'); }
    catch (saveError) { setError(errorMessage(saveError)); }
    finally { setBusy(false); }
  };

  const issueBook = async (event) => {
    event.preventDefault(); if (!student) return;
    setBusy(true); setError('');
    try { await issueLibraryBook({ studentId: student.id, bookId: Number(loanForm.bookId), dueAt: loanForm.dueAt }); setLoanForm({ bookId: '', dueAt: '' }); await loadBooks(); showToast('Library loan recorded.', 'success'); }
    catch (saveError) { setError(errorMessage(saveError)); }
    finally { setBusy(false); }
  };

  const savePolicy = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await updateLibraryPolicy({ maxActiveLoans: Number(policy.maxActiveLoans), finePerDay: policy.finePerDay || null }); showToast('Library policy saved.', 'success'); }
    catch (saveError) { setError(errorMessage(saveError)); }
    finally { setBusy(false); }
  };

  const reviewDocument = async (documentId, status) => {
    const remarks = status === 'REJECTED' ? window.prompt('Reason for rejection (required):') : '';
    if (status === 'REJECTED' && !remarks?.trim()) return;
    setBusy(true); setError('');
    try { await reviewStudentDocument(documentId, { status, remarks }); await loadDocuments(); showToast(`Document ${status.toLowerCase()}.`, 'success'); }
    catch (reviewError) { setError(errorMessage(reviewError)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 pb-10">
      <header><p className="text-sm font-semibold text-indigo-600">Administrator</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Student Services</h1><p className="mt-1 text-sm text-slate-500">Manage real fee ledger, library inventory and student document review records.</p></header>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">{[['fees', 'Fees'], ['library', 'Library'], ['documents', 'Documents']].map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{label}</button>)}</div>

      {tab === 'fees' && <div className="space-y-5">
        <form onSubmit={findStudent} className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4"><label className="min-w-64 flex-1 text-xs font-semibold text-slate-700">Existing student ID<input required value={studentKey} onChange={(event) => setStudentKey(event.target.value)} className={inputClass} /></label><button disabled={busy} className="self-end rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{busy ? 'Loading…' : 'Find student'}</button></form>
        {student && <><div className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><b>{student.user?.name}</b> · {student.studentId} · {student.academicYear} · {student.year} / {student.division}</div><div className="grid gap-5 lg:grid-cols-2">
          <form onSubmit={submitCharge} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Add fee charge</h2><label className="block text-xs">Description<input required value={chargeForm.title} onChange={(event) => setChargeForm({ ...chargeForm, title: event.target.value })} className={inputClass} /></label><label className="block text-xs">Academic year<input required value={chargeForm.academicYear} onChange={(event) => setChargeForm({ ...chargeForm, academicYear: event.target.value })} className={inputClass} /></label><label className="block text-xs">Amount<input required type="number" min="0" step="0.01" value={chargeForm.amount} onChange={(event) => setChargeForm({ ...chargeForm, amount: event.target.value })} className={inputClass} /></label><label className="block text-xs">Due date (optional)<input type="date" value={chargeForm.dueDate} onChange={(event) => setChargeForm({ ...chargeForm, dueDate: event.target.value })} className={inputClass} /></label><button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Record charge</button></form>
          <form onSubmit={submitPayment} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Record an existing payment</h2><p className="text-xs text-slate-500">This records a payment already received. It does not process online payments.</p><label className="block text-xs">Fee charge (optional)<select value={paymentForm.chargeId} onChange={(event) => setPaymentForm({ ...paymentForm, chargeId: event.target.value })} className={inputClass}><option value="">Unassigned payment</option>{fees?.charges?.map((charge) => <option key={charge.id} value={charge.id}>{charge.title} · {money(charge.amount)} · #{charge.id}</option>)}</select></label><label className="block text-xs">Receipt number<input required value={paymentForm.receiptNumber} onChange={(event) => setPaymentForm({ ...paymentForm, receiptNumber: event.target.value })} className={inputClass} /></label><label className="block text-xs">Amount<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} className={inputClass} /></label><label className="block text-xs">Payment method (optional)<input value={paymentForm.paymentMethod} onChange={(event) => setPaymentForm({ ...paymentForm, paymentMethod: event.target.value })} className={inputClass} /></label><button disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Record payment</button></form>
        </div><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Fee ledger</h2>{!fees?.charges?.length && !fees?.payments?.length ? <p className="text-sm text-slate-500">No fee records.</p> : <div className="space-y-2">{fees?.charges?.map((charge) => <div key={`c${charge.id}`} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"><span>{charge.title} · {charge.academicYear} · {charge.dueDate ? new Date(charge.dueDate).toLocaleDateString() : 'No due date'}</span><b>Charge {money(charge.amount)} · paid {money(charge.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0))}</b></div>)}{fees?.payments?.map((payment) => <div key={`p${payment.id}`} className="flex justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm"><span>Receipt {payment.receiptNumber} · {new Date(payment.paidAt).toLocaleDateString()}</span><b>Payment {money(payment.amount)}</b></div>)}</div>}</section></>}
      </div>}

      {tab === 'library' && <div className="space-y-5">
        <form onSubmit={addBook} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"><h2 className="sm:col-span-2 lg:col-span-3 font-semibold">Add inventory record</h2>{[['title', 'Title'], ['author', 'Author'], ['isbn', 'ISBN'], ['accessionCode', 'Accession code'], ['totalCopies', 'Total copies']].map(([key, label]) => <label key={key} className="text-xs">{label}<input required={key === 'title' || key === 'totalCopies'} type={key === 'totalCopies' ? 'number' : 'text'} min={key === 'totalCopies' ? '0' : undefined} value={bookForm[key]} onChange={(event) => setBookForm({ ...bookForm, [key]: event.target.value })} className={inputClass} /></label>)}<button disabled={busy} className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add book</button></form>
        <form onSubmit={issueBook} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"><h2 className="sm:col-span-3 font-semibold">Issue a book to the found student</h2><label className="text-xs">Student ID<input required value={studentKey} onChange={(event) => setStudentKey(event.target.value)} className={inputClass} /></label><button type="button" onClick={findStudent} disabled={busy} className="self-end rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Find student</button><label className="text-xs">Book<select required value={loanForm.bookId} onChange={(event) => setLoanForm({ ...loanForm, bookId: event.target.value })} className={inputClass}><option value="">Select available book</option>{books.filter((book) => book.availableCopies > 0).map((book) => <option key={book.id} value={book.id}>{book.title} · {book.availableCopies} available</option>)}</select></label><label className="text-xs">Due date<input required type="date" value={loanForm.dueAt} onChange={(event) => setLoanForm({ ...loanForm, dueAt: event.target.value })} className={inputClass} /></label><button disabled={busy || !student} className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Issue book</button><p className="self-end text-xs text-slate-500">{student ? `${student.user?.name} · ${student.studentId}` : 'Find an existing student first.'}</p></form>
        <form onSubmit={savePolicy} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"><h2 className="sm:col-span-3 font-semibold">Library policy</h2><label className="text-xs">Maximum active loans (0 = unlimited)<input type="number" min="0" value={policy.maxActiveLoans} onChange={(event) => setPolicy({ ...policy, maxActiveLoans: event.target.value })} className={inputClass} /></label><label className="text-xs">Fine per overdue day (optional)<input type="number" min="0" step="0.01" value={policy.finePerDay} onChange={(event) => setPolicy({ ...policy, finePerDay: event.target.value })} className={inputClass} /></label><button disabled={busy} className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save policy</button></form>
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-semibold">Inventory and loans</h2>{books.length === 0 ? <p className="text-sm text-slate-500">No library book records.</p> : <div className="space-y-2">{books.map((book) => <p key={book.id} className="rounded-lg bg-slate-50 p-3 text-sm">{book.title} · {book.author || 'Author not recorded'} · {book.availableCopies} / {book.totalCopies} available</p>)}</div>}{loans.length > 0 && <div className="mt-5 space-y-2">{loans.map((loan) => <div key={loan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 text-sm"><span>{loan.bookTitle} → {loan.studentName} ({loan.studentKey}) · due {new Date(loan.dueAt).toLocaleDateString()} · {loan.returnedAt ? `Returned ${new Date(loan.returnedAt).toLocaleDateString()}` : 'On loan'}</span>{!loan.returnedAt && <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await returnLibraryBook(loan.id); await loadBooks(); } catch (returnError) { setError(errorMessage(returnError)); } finally { setBusy(false); } }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Mark returned</button>}</div>)}</div>}</section>
      </div>}

      {tab === 'documents' && <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Student document review</h2><p className="text-xs text-slate-500">Files must already be stored behind the listed HTTPS URL. This module does not upload file contents.</p></div><select value={documentStatus} onChange={async (event) => { const value = event.target.value; setDocumentStatus(value); setError(''); try { await loadDocuments(value); } catch (loadError) { setError(errorMessage(loadError)); } }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="SUBMITTED">Submitted</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option><option value="ALL">All</option></select></div>{documents.length === 0 ? <p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">No document records in this status.</p> : <div className="space-y-3">{documents.map((document) => <article key={document.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{document.title}</h3><p className="text-xs text-slate-600">{document.studentName} · {document.studentKey} · {document.documentType} · {document.status}</p><p className="text-xs text-slate-500">{document.fileName} · {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>{document.reviewerRemarks && <p className="mt-1 text-xs">{document.reviewerRemarks}</p>}<a href={document.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700">Open stored document</a></div>{document.status === 'SUBMITTED' && <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => reviewDocument(document.id, 'VERIFIED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Verify</button><button type="button" disabled={busy} onClick={() => reviewDocument(document.id, 'REJECTED')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Reject</button></div>}</div></article>)}</div>}</section>}
    </div>
  );
};

export default AdminStudentServices;
