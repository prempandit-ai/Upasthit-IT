import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMeRequest,
  loginRequest,
} from "../services/authService";
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  getTokenExpiry,
  isTokenExpired,
  setStoredUser,
  setToken,
} from "../utils/token";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setAuthToken] = useState(getToken());
  const [loading, setLoading] = useState(true);
  const [rbacStatus, setRbacStatus] = useState(null);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setAuthToken(null);
    setRbacStatus(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await loginRequest(credentials);
    setToken(data.token);
    setStoredUser(data.user);
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const completeSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setStoredUser(nextUser);
    setAuthToken(nextToken);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await getMeRequest();
    setUser(data.user);
    setStoredUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedToken = getToken();

      if (!storedToken || isTokenExpired(storedToken)) {
        logout();
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
        setAuthToken(storedToken);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, [logout, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token && !isTokenExpired(token)),
      tokenExpiry: getTokenExpiry(token),
      rbacStatus,
      setRbacStatus,
      login,
      logout,
      completeSession,
      refreshUser,
      dashboardPath: user ? getDashboardPathForRole(user.role) : "/login",
    }),
    [user, token, loading, rbacStatus, login, logout, completeSession, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
};
