/**
 * Config Service - openclaw.json API
 */
import { apiClient } from './api';

/**
 * Get current openclaw.json config
 */
export const getConfig = async (): Promise<unknown> => {
  const response = await apiClient.get('/config');
  return response.data;
};

/**
 * Update openclaw.json config
 */
export const updateConfig = async (config: unknown): Promise<void> => {
  await apiClient.post('/config', config);
};