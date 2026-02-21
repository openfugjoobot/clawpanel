/**
 * Workspace Service - File Browser API
 */
import { apiClient } from './api';

// File/Directory item types
export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt: string;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
  writable: boolean;
  modifiedAt: string;
}

// Get files in a directory
export const getFiles = async (path: string = ''): Promise<FileItem[]> => {
  const response = await apiClient.get('/workspace', {
    params: { path },
  });
  return response.data;
};

// Get file content
export const getFileContent = async (path: string): Promise<FileContent> => {
  const response = await apiClient.get(`/files/${encodeURIComponent(path)}`);
  return response.data;
};

// Save file content
export const saveFile = async (path: string, content: string): Promise<FileContent> => {
  const response = await apiClient.post(`/files/${encodeURIComponent(path)}`, {
    content,
  });
  return response.data;
};
