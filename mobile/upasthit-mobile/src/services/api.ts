import axios, { AxiosError } from 'axios';

import { clearAuthStorage, getToken, isTokenExpired } from '@/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not configured. ' +
      'Add it to your .env file (e.g. EXPO_PUBLIC_API_URL=http://192.168.0.105:5000).'
  );
}

if (__DEV__) {
  console.log('[API] Base URL:', `${API_URL}/api`);
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Classifies an Axios error into a human-readable message.
 * Exported so screens can use it without duplicating logic.
 */
export function classifyApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;

  // No response → the request never reached the server (network/firewall issue)
  if (!axiosError.response) {
    return 'Cannot connect to server. Check your network connection and make sure the backend is running.';
  }

  const status = axiosError.response.status;
  const serverMessage = axiosError.response.data?.message;

  if (status === 401) {
    return serverMessage ?? 'Invalid email or password.';
  }
  if (status === 404) {
    return 'API endpoint not found. The server may be misconfigured.';
  }
  if (status >= 500) {
    return 'Server error. Please try again later.';
  }

  // Fall back to the server's own message, or a generic one
  return serverMessage ?? 'An unexpected error occurred.';
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if ((error as AxiosError).response?.status === 401) {
      await clearAuthStorage();
    }

    return Promise.reject(error);
  }
);

export default api;
