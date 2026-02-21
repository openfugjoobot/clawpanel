import { useState, useCallback } from 'react';
import axios, { type AxiosRequestConfig } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const request = useCallback(async (
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await axios({
        url,
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers
        }
      });
      
      setState({
        data: response.data,
        loading: false,
        error: null
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message || err.message 
        : 'An unknown error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
      
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    request,
    reset
  };
}
