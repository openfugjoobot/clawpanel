/**
 * API Client with Axios + Basic Auth
 * 
 * SECURITY NOTES:
 * - NEVER store credentials in code or localStorage for production
 * - Current implementation uses localStorage for demo purposes only
 * - For production: implement secure token refresh or use HTTP-only cookies
 * - Default credentials are for development only - MUST be changed in production
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Get config from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

// SECURITY WARNING: Do not commit real credentials!
// These are development defaults only - backend will reject if not configured
const DEFAULT_USER = import.meta.env.VITE_API_USER || '';
const DEFAULT_PASS = import.meta.env.VITE_API_PASS || '';

/**
 * Get token from localStorage
 * WARNING: localStorage is vulnerable to XSS attacks
 * For production, use HTTP-only cookies instead
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
 * Create Basic Auth header from stored credentials
 * Falls back to empty credentials - backend must be configured
 */
const createBasicAuthHeader = (): string => {
  // Try stored credentials first
  const storedToken = getStoredToken();
  if (storedToken) {
    return storedToken;
  }
  
  // Fall back to environment variables (for development only)
  if (DEFAULT_USER && DEFAULT_PASS) {
    const credentials = `${DEFAULT_USER}:${DEFAULT_PASS}`;
    return 'Basic ' + btoa(credentials);
  }
  
  // No credentials - let the request fail with 401
  return '';
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
    const authHeader = createBasicAuthHeader();
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
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
 * - Redirects to login on 401
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          console.error('[API] Authentication failed');
          // Redirect to login on auth failure
          window.location.href = '/login';
          break;
        case 403:
          console.error('[API] Access forbidden');
          break;
        case 429:
          console.error('[API] Rate limit exceeded');
          break;
        case 404:
          console.error('[API] Resource not found');
          break;
        case 500:
          console.error('[API] Server error');
          break;
        default:
          console.error(`[API] HTTP ${status}`);
      }
    } else if (error.request) {
      console.error('[API] No response from server');
    } else {
      console.error('[API] Request setup error');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
