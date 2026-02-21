/**
 * Agents Service
 * Handles agent lifecycle operations
 */
import apiClient from './api';
import type { Agent } from '../types';

/**
 * Get all agents
 * @returns Promise with array of agents
 */
export const getAgents = async (): Promise<Agent[]> => {
  const response = await apiClient.get<Agent[]>('/agents');
  return response.data;
};

/**
 * Get a specific agent by ID
 * @param id - Agent ID
 * @returns Promise with agent details
 */
export const getAgent = async (id: string): Promise<Agent> => {
  const response = await apiClient.get<Agent>(`/agents/${id}`);
  return response.data;
};

/**
 * Spawn a new agent with a task
 * @param id - Agent ID
 * @param task - Task description for the agent
 * @returns Promise with created agent
 */
export const spawnAgent = async (id: string, task: string): Promise<Agent> => {
  const response = await apiClient.post<Agent>('/agents', { id, task });
  return response.data;
};

/**
 * Kill/terminate an agent
 * @param id - Agent ID to terminate
 * @returns Promise that resolves when agent is killed
 */
export const killAgent = async (id: string): Promise<void> => {
  await apiClient.delete(`/agents/${id}`);
};

/**
 * Get agent logs
 * @param id - Agent ID
 * @returns Promise with agent logs
 */
export const getAgentLogs = async (id: string): Promise<string[]> => {
  const response = await apiClient.get<{ logs: string[] }>(`/agents/${id}/logs`);
  return response.data.logs;
};
