const TOKEN_KEY = 'stride.token';
const USER_KEY = 'stride.user';

const isBrowser = () => typeof window !== 'undefined';

export const getToken = () => (isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null);

export const getStoredUser = () => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};
