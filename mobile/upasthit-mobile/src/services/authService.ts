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

export type RegistrationOptions = {
  departments: { id: number; code: string; name: string }[];
  programs: string[];
  years: string[];
  semestersByYear: Record<string, number[]>;
  divisions: string[];
  academicYears: string[];
  genders: string[];
  bloodGroups: string[];
  relationships: string[];
};

export const getRegistrationOptions = () =>
  api.get<{ success: boolean } & RegistrationOptions>('/auth/registration-options');

export const registerRequest = (payload: Record<string, unknown>) =>
  api.post<AuthResponse>('/auth/register', payload);

export const getMeRequest = () =>
  api.get<{ success: boolean; user: AuthUser }>('/auth/me');
