/**
 * GitHub Service
 * Handles GitHub API operations for issues and pull requests
 */
import apiClient from './api';
import type { GitHubIssue, GitHubPullRequest } from '../types';

/**
 * Get issues for a repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - Issue state filter: open, closed, or all
 * @returns Promise with array of issues
 */
export const getIssues = async (
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> => {
  const response = await apiClient.get<GitHubIssue[]>(
    `/github/${owner}/${repo}/issues?state=${state}`
  );
  return response.data;
};

/**
 * Get pull requests for a repository
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param state - PR state filter: open, closed, or all
 * @returns Promise with array of pull requests
 */
export const getPRs = async (
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPullRequest[]> => {
  const response = await apiClient.get<GitHubPullRequest[]>(
    `/github/${owner}/${repo}/pulls?state=${state}`
  );
  return response.data;
};
