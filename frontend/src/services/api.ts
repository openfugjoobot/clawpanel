/**
 * API Client with Axios + Basic Auth
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Get config from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const API_USER = import.meta.env.VITE_API_USER || 'admin';
const API_PASS = import.meta.env.VITE_API_PASS || 'changeme';

/**
 * Get token from localStorage
 */
const getStoredToken = (): string | null => {
  try {
    const stored = localStorage.getItem('clawpanel_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token || null;
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
};

/**
 * Create Basic Auth header from stored credentials or environment defaults
 */
const createBasicAuthHeader = (): string => {
  // Try stored credentials first
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }
  
  // Fall back to environment variables
  const credentials = `${API_USER}:${API_PASS}`;
  return 'Basic ' + btoa(credentials);
};

/**
 * Axios instance with interceptors
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request Interceptor
 * - Adds Basic Auth header to every request
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.Authorization = createBasicAuthHeader();
    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as { message?: string };
      
      switch (status) {
        case 401:
          console.error('[API] Authentication failed - check credentials');
          break;
        case 403:
          console.error('[API] Access forbidden');
          break;
        case 404:
          console.error('[API] Resource not found');
          break;
        case 500:
          console.error('[API] Server error:', data?.message || 'Unknown error');
          break;
        default:
          console.error(`[API] HTTP ${status}:`, data?.message || error.message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] No response from server - is the backend running?');
    } else {
      // Something happened in setting up the request
      console.error('[API] Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
