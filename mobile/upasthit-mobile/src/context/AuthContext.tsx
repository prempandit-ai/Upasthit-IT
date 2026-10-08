import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getMeRequest, loginRequest } from '@/services/authService';
import {
  AuthUser,
  clearAuthStorage,
  getStoredUser,
  getToken,
  isTokenExpired,
  setStoredUser,
  setToken,
} from '@/utils/storage';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  completeSession: (nextToken: string, nextUser: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await clearAuthStorage();
    } catch (error) {
      console.error('Failed to clear auth storage during logout:', error);
    } finally {
      setUser(null);
      setAuthToken(null);
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

    try {
      await setToken(nextToken);
      await setStoredUser(nextUser);
    } catch (error) {
      console.error('Failed to persist session to storage:', error);
      throw error;
    }
    setAuthToken(nextToken);
    setUser(nextUser);
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
      try {
        const storedToken = await getToken();

        if (!storedToken || isTokenExpired(storedToken)) {
          await logout();
          return;
        }

        const storedUser = await getStoredUser();
        if (storedUser && isMounted) {
          setUser(storedUser);
          setAuthToken(storedToken);
        }

        try {
          const { data } = await getMeRequest();
          if (isMounted) {
            await setStoredUser(data.user);
            setUser(data.user);
            setAuthToken(storedToken);
          }
        } catch (apiError) {
          console.warn('Failed to validate token with server during bootstrap:', apiError);
          // If no cached user could be restored, clear invalid/unreachable session
          if (!storedUser && isMounted) {
            await logout();
          }
        }
      } catch (error) {
        console.error('Unexpected error during auth bootstrap:', error);
        if (isMounted) {
          await logout();
        }
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
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token && !isTokenExpired(token)),
      login,
      logout,
      completeSession,
    }),
    [user, token, loading, login, logout, completeSession]
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