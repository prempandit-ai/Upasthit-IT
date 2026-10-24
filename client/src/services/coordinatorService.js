import api from './api';

export const getCoordinatorDashboardStats = async () => {
  const response = await api.get('/api/coordinator/dashboard/portal-events');
  if (!response.data?.success) throw new Error('Event dashboard data was not confirmed by the server.');
  return response.data;
};

export const getEvents = async (params = {}) => {
  const response = await api.get('/api/coordinator/events', { params });
  if (!response.data?.success || !Array.isArray(response.data.events)) throw new Error('Events could not be loaded.');
  return response.data.events;
};

export const createEvent = async (eventData) => {
  const response = await api.post('/api/coordinator/events', eventData);
  if (!response.data?.success || !response.data?.event?.id) throw new Error('The server did not confirm event creation.');
  return response.data;
};

export const getParticipants = async (params = {}) => {
  const response = await api.get('/api/coordinator/participants', { params });
  if (!response.data?.success || !Array.isArray(response.data.participants)) throw new Error('Event registrations could not be loaded.');
  return response.data.participants;
};

export const addParticipant = async (participantData) => {
  const response = await api.post('/api/coordinator/participants', participantData);
  if (!response.data?.success) throw new Error('The server did not confirm event registration.');
  return response.data;
};

export const bulkImportParticipants = async (participantsArray) => {
  const response = await api.post('/api/coordinator/participants/bulk', { participants: participantsArray });
  if (!response.data?.success) throw new Error('The server did not confirm the registrations.');
  return response.data;
};

export const getFacultyList = async (params = {}) => {
  const response = await api.get('/api/coordinator/faculty', { params });
  if (!response.data?.success || !Array.isArray(response.data.faculty)) throw new Error('Faculty records could not be loaded.');
  return response.data.faculty;
};

export const mapFacultyToEvent = async (mapping) => {
  const response = await api.post('/api/coordinator/faculty/mapping', mapping);
  if (!response.data?.success) throw new Error('The server did not confirm faculty mapping.');
  return response.data;
};

export const getCoordinatorReports = async (filters = {}) => {
  const response = await api.get('/api/coordinator/reports/events', { params: filters });
  if (!response.data?.success) throw new Error('Event report data could not be loaded.');
  return response.data;
};

export default {
  getCoordinatorDashboardStats,
  getEvents,
  createEvent,
  getParticipants,
  addParticipant,
  bulkImportParticipants,
  getFacultyList,
  mapFacultyToEvent,
  getCoordinatorReports,
};
