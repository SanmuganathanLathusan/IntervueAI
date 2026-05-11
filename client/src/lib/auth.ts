/**
 * Session management utilities for authentication
 */

import type { User } from './types';

const SESSION_KEY = 'ai-smart-interview-session';
const TOKEN_KEY = 'ai-smart-interview-token';
const USER_KEY = 'ai-smart-interview-user';

export interface Session {
  token: string;
  user: User;
}

/**
 * Save session (token + user) to localStorage
 */
export const saveSession = ({ token, user }: Session): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

/**
 * Get stored authentication token
 */
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Get stored user data
 */
export const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Update stored user (e.g., after profile changes)
 */
export const updateStoredUser = (user: User): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Emit custom event so pages can react to user updates
    window.dispatchEvent(new CustomEvent('user-updated'));
  } catch (error) {
    console.error('Failed to update stored user:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};

/**
 * Clear session (logout)
 */
export const clearSession = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

/**
 * Get stored interview session
 */
export const getStoredInterviewSession = () => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save interview session
 */
export const saveInterviewSession = (data: unknown): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save interview session:', error);
  }
};

/**
 * Clear interview session
 */
export const clearInterviewSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear interview session:', error);
  }
};
