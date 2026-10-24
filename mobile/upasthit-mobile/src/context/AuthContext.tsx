import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DeviceEventEmitter } from 'react-native';

import { getMeRequest, loginRequest } from '@/services/authService';
import { classifyApiError } from '@/services/api';
import {
  AuthUser,
  clearAuthStorage,
  getToken,
  decodeTokenPayload,
  isTokenExpired,
  setStoredUser,
  setToken,
} from '@/utils/storage';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  bootstrapError: string | null;
  isAuthenticated: boolean;
  retryBootstrap: () => void;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  completeSession: (nextToken: string, nextUser: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);

  const retryBootstrap = useCallback(() => {
    setBootstrapError(null);
    setLoading(true);
    setBootstrapAttempt((attempt) => attempt + 1);
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearAuthStorage();
    } catch (error) {
      console.error('Failed to clear auth storage during logout:', error);
    } finally {
      setUser(null);
      setAuthToken(null);
      setBootstrapError(null);
    }
  }, []);

  const completeSession = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    if (!nextToken || typeof nextToken !== 'string') {
      throw new Error(
        'Authentication response did not contain a valid token. ' +
          'The server may not have issued a JWT for this operation.'
      );
    }

    if (!nextUser || typeof nextUser !== 'object') {
      throw new Error('Authentication response did not contain valid user data.');
    }
    if (nextUser.role !== 'STUDENT' || nextUser.status !== 'APPROVED' || nextUser.isActive !== true) {
      throw new Error('Only active, approved student accounts can access the Student Mobile Portal.');
    }

    try {
      await setToken(nextToken);
      await setStoredUser(nextUser);
    } catch (error) {
      console.error('Failed to persist session to storage:', error);
      throw error;
    }
    setAuthToken(nextToken);
    setUser(nextUser);
    setBootstrapError(null);
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { data } = await loginRequest(credentials);
      await completeSession(data.token, data.user);
      return data.user;
    },
    [completeSession]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setBootstrapError(null);
      try {
        const storedToken = await getToken();

        if (!isMounted) return;

        if (!storedToken || isTokenExpired(storedToken)) {
          await logout();
          return;
        }

        try {
          const { data } = await getMeRequest();
          if (!isMounted) return;
          if (data.user.role !== 'STUDENT' || data.user.status !== 'APPROVED' || data.user.isActive !== true) {
            await logout();
            return;
          }
          await setStoredUser(data.user);
          if (!isMounted) return;
          setUser(data.user);
          setAuthToken(storedToken);
        } catch (apiError) {
          if (!isMounted) return;

          const status = (apiError as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403) {
            // /auth/me uses 401 for invalid/expired tokens and 403 for
            // pending, rejected, or inactive accounts. Those sessions are revoked.
            await logout();
            return;
          }

          // Keep persisted credentials during network/timeout/5xx failures, but
          // leave the in-memory identity empty so protected routes stay locked.
          setUser(null);
          setAuthToken(null);
          setBootstrapError(classifyApiError(apiError));
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Unexpected error during auth bootstrap:', error);
        setUser(null);
        setAuthToken(null);
        setBootstrapError(classifyApiError(error));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [logout, bootstrapAttempt]);

  useEffect(() => {
    if (!token) return undefined;
    const payload = decodeTokenPayload(token);
    if (!payload?.exp) {
      logout();
      return undefined;
    }
    const delay = Math.max(0, payload.exp * 1000 - Date.now());
    const timeout = setTimeout(() => logout(), delay);
    return () => clearTimeout(timeout);
  }, [token, logout]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('auth:session-invalid', () => {
      logout();
    });
    return () => subscription.remove();
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      bootstrapError,
      isAuthenticated: Boolean(
        user && token && !isTokenExpired(token) && user.role === 'STUDENT' &&
        user.status === 'APPROVED' && user.isActive === true
      ),
      login,
      logout,
      completeSession,
      retryBootstrap,
    }),
    [user, token, loading, bootstrapError, login, logout, completeSession, retryBootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
