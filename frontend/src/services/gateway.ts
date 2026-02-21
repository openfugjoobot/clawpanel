/**
 * Gateway Service
 * Handles gateway status and control operations
 */
import apiClient from './api';
import type { GatewayStatus } from '../types';

/**
 * Get current gateway status
 * @returns Promise with gateway status
 */
export const getGatewayStatus = async (): Promise<GatewayStatus> => {
  const response = await apiClient.get<GatewayStatus>('/gateway/status');
  return response.data;
};

/**
 * Start the gateway service
 * @returns Promise with operation result
 */
export const startGateway = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/gateway/start');
  return response.data;
};

/**
 * Stop the gateway service
 * @returns Promise with operation result
 */
export const stopGateway = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/gateway/stop');
  return response.data;
};

/**
 * Restart the gateway service
 * @returns Promise with operation result
 */
export const restartGateway = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/gateway/restart');
  return response.data;
};
