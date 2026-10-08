import api from '@/services/api';
import { AuthUser } from '@/utils/storage';

type AuthResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};

export const loginRequest = (credentials: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', credentials);

export const registerRequest = (payload: {
  name: string;
  email: string;
  password: string;
}) => api.post<AuthResponse>('/auth/register', payload);

export const getMeRequest = () =>
  api.get<{ success: boolean; user: AuthUser }>('/auth/me');
