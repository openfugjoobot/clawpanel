/**
 * Cron Service
 * Handles cron job management
 */
import apiClient from './api';
import type { CronJob, CreateCronJobPayload } from '../types';

/**
 * Get all cron jobs
 * @returns Promise with array of cron jobs
 */
export const getCronJobs = async (): Promise<CronJob[]> => {
  const response = await apiClient.get<CronJob[]>('/cron');
  return response.data;
};

/**
 * Get a specific cron job by ID
 * @param id - Cron job ID
 * @returns Promise with cron job details
 */
export const getCronJob = async (id: string): Promise<CronJob> => {
  const response = await apiClient.get<CronJob>(`/cron/${id}`);
  return response.data;
};

/**
 * Create a new cron job
 * @param data - Cron job data
 * @returns Promise with created cron job
 */
export const createCronJob = async (data: CreateCronJobPayload): Promise<CronJob> => {
  const response = await apiClient.post<CronJob>('/cron', data);
  return response.data;
};

/**
 * Delete a cron job
 * @param id - Cron job ID to delete
 * @returns Promise that resolves when cron job is deleted
 */
export const deleteCronJob = async (id: string): Promise<void> => {
  await apiClient.delete(`/cron/${id}`);
};

/**
 * Update an existing cron job
 * @param id - Cron job ID
 * @param data - Updated cron job data
 * @returns Promise with updated cron job
 */
export const updateCronJob = async (id: string, data: Partial<CreateCronJobPayload>): Promise<CronJob> => {
  const response = await apiClient.put<CronJob>(`/cron/${id}`, data);
  return response.data;
};
