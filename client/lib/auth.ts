import type { User } from './types';

const TOKEN_KEY = 'ai-smart-interview-token';
const USER_KEY = 'ai-smart-interview-user';

const isBrowser = () => typeof window !== 'undefined';

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  );
};

export const getStoredToken = () => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  if (!isBrowser()) return null;
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (rawUser) {
    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  const token = getStoredToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(base64UrlDecode(payload)) as { userId?: string; name?: string; email?: string; avatar?: string };
    if (!decoded.userId) return null;
    return {
      id: decoded.userId,
      name: decoded.name || 'Interview User',
      email: decoded.email || '',
      avatar: decoded.avatar,
    };
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }: { token: string; user: User }) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem('ai-smart-interview-session');
};

export const authHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const requireClientUser = () => {
  const user = getStoredUser();
  if (!user) {
    throw new Error('Please sign in first');
  }
  return user;
};
