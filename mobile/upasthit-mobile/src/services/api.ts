import axios, { AxiosError } from 'axios';
import * as Device from 'expo-device';
import { DeviceEventEmitter } from 'react-native';

import { clearAuthStorage, getToken, isTokenExpired } from '@/utils/storage';

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

function normalizeApiBaseUrl(value: string): string {
  if (!value) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not configured. ' +
        'Set it to the backend origin or API base URL in your .env file.'
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value.replace(/\s+/g, ''));
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL must be a valid absolute HTTP or HTTPS URL.');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL must use the http:// or https:// protocol.');
  }

  // Treat the environment value as either an origin or an API base. This keeps
  // callers such as /auth/me on one consistent /api prefix.
  const basePath = parsedUrl.pathname
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment.toLowerCase() !== 'api');
  parsedUrl.pathname = `/${[...basePath, 'api'].join('/')}`;
  parsedUrl.search = '';
  parsedUrl.hash = '';

  return parsedUrl.toString().replace(/\/$/, '');
}

const API_URL = normalizeApiBaseUrl(rawApiUrl);
const apiHostname = new URL(API_URL).hostname.toLowerCase().replace(/^\[|\]$/g, '');
const isLoopbackHost = ['localhost', '127.0.0.1', '::1'].includes(apiHostname);
if (__DEV__ && Device.isDevice && isLoopbackHost) {
  throw new Error(
    'A physical device cannot reach the laptop backend through localhost. ' +
      'Set EXPO_PUBLIC_API_URL to the laptop\'s reachable LAN IP.'
  );
}
if (__DEV__ && isLoopbackHost) {
  console.warn(
    '[API] EXPO_PUBLIC_API_URL uses a loopback host. A physical device needs the laptop\'s reachable LAN IP.'
  );
}

if (__DEV__) {
  // Keep the configured host out of logs while still confirming API path setup.
  console.log('[API] Base URL configured; API path:', new URL(API_URL).pathname);
}

const api = axios.create({
  baseURL: API_URL,
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
    if (error instanceof Error && !(error instanceof AxiosError)) return error.message;
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return 'The server request timed out. Check the connection and retry.';
    }
    return 'Cannot connect to server. Check your network connection and make sure the backend is running.';
  }

  const status = axiosError.response.status;
  const serverMessage = axiosError.response.data?.message;

  if (status === 401) {
    return serverMessage ?? 'Invalid email or password.';
  }
  if (status === 422) {
    const firstFieldError = (axiosError.response.data as { errors?: { message?: string }[] })
      ?.errors?.[0]?.message;
    return firstFieldError || serverMessage || 'Validation failed.';
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
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;
    const authRevoked = status === 403 && /account is deactivated|account is not approved/i.test(
      axiosError.response?.data?.message || ''
    );
    if (status === 401 || authRevoked) {
      await clearAuthStorage();
      DeviceEventEmitter.emit('auth:session-invalid');
    }

    return Promise.reject(error);
  }
);

export default api;
