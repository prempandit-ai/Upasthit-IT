import api from './api';

export const lookupStudentById = (studentId) => api.get(`/api/students/gr/${encodeURIComponent(studentId)}`);
export const getAdminStudentFees = (profileId) => api.get(`/api/admin/fees/students/${profileId}`);
export const createFeeCharge = (payload) => api.post('/api/admin/fees/charges', payload);
export const recordFeePayment = (payload) => api.post('/api/admin/fees/payments', payload);
export const getLibraryBooks = () => api.get('/api/admin/library/books');
export const createLibraryBook = (payload) => api.post('/api/admin/library/books', payload);
export const getLibraryLoans = () => api.get('/api/admin/library/loans');
export const issueLibraryBook = (payload) => api.post('/api/admin/library/loans', payload);
export const returnLibraryBook = (id) => api.patch(`/api/admin/library/loans/${id}/return`);
export const getLibraryPolicy = () => api.get('/api/admin/library/policy');
export const updateLibraryPolicy = (payload) => api.put('/api/admin/library/policy', payload);
export const getStudentDocumentsForReview = (status = 'ALL') => api.get('/api/admin/documents', { params: { status } });
export const reviewStudentDocument = (id, payload) => api.patch(`/api/admin/documents/${id}/review`, payload);
