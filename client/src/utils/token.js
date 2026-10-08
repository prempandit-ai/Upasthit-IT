const TOKEN_KEY = "upasthit_token";
const USER_KEY = "upasthit_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuthStorage = () => {
  removeToken();
  removeStoredUser();
};

export const decodeTokenPayload = (token) => {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const getTokenExpiry = (token) => {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
};
