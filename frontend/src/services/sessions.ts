/**
 * Sessions Service
 * Handles session management operations
 */
import apiClient from './api';
import type { Session } from '../types';

/**
 * Get all active sessions
 * @returns Promise with array of sessions
 */
export const getSessions = async (): Promise<Session[]> => {
  const response = await apiClient.get<Session[]>('/sessions');
  return response.data;
};

/**
 * Get a specific session by key
 * @param key - Session key
 * @returns Promise with session details
 */
export const getSession = async (key: string): Promise<Session> => {
  const response = await apiClient.get<Session>(`/sessions/${key}`);
  return response.data;
};

/**
 * Kill/terminate a session
 * @param key - Session key to terminate
 * @returns Promise that resolves when session is killed
 */
export const killSession = async (key: string): Promise<void> => {
  await apiClient.delete(`/sessions/${key}`);
};

/**
 * Kill multiple sessions at once
 * @param keys - Array of session keys to terminate
 * @returns Promise that resolves when all sessions are killed
 */
export const killSessions = async (keys: string[]): Promise<void> => {
  await apiClient.post('/sessions/kill', { keys });
};
