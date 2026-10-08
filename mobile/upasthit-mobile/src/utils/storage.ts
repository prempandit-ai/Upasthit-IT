import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'upasthit_token';
const USER_KEY = 'upasthit_user';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'COORDINATOR' | 'ADMIN';
  status?: string;
  isActive: boolean;
  profile?: any;
  createdAt?: string;
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token from AsyncStorage:', error);
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  if (!token || typeof token !== 'string') {
    throw new Error(
      'setToken received an invalid token. ' +
        'The authentication response did not include a valid JWT string.'
    );
  }
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to set token in AsyncStorage:', error);
    throw error;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token from AsyncStorage:', error);
    throw error;
  }
};

export const getStoredUser = async (): Promise<AuthUser | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (error) {
    console.error('Failed to get stored user from AsyncStorage:', error);
    return null;
  }
};

export const setStoredUser = async (user: AuthUser): Promise<void> => {
  if (!user || typeof user !== 'object') {
    throw new Error(
      'setStoredUser received an invalid user object. ' +
        'The authentication response did not include valid user data.'
    );
  }
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to set stored user in AsyncStorage:', error);
    throw error;
  }
};

export const removeStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to remove stored user from AsyncStorage:', error);
    throw error;
  }
};

export const clearAuthStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch {
    await Promise.allSettled([removeToken(), removeStoredUser()]);
  }
};

export const decodeTokenPayload = (token: string | null) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    return JSON.parse(atob(payload)) as { exp?: number };
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string | null) => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};