/**
 * useWebSocket - React hook for WebSocket connection management
 * Issue #22 - WebSocket Real-Time Dashboard
 * 
 * Features:
 * - Connect to WSS endpoint with Basic Auth via Header (NOT URL!)
 * - Exponential backoff reconnect (1s, 2s, 4s, 8s... max 30s)
 * - Max 10 reconnect attempts
 * - Auto-reconnect on unexpected close
 * - Parse incoming JSON events
 * - Send periodic ping (every 25s)
 * - Clean disconnect on unmount
 * 
 * SECURITY NOTE: Credentials are sent via Authorization header subprotocol,
 * NOT via URL query parameters. URLs get logged in server logs, browser
 * history, and proxy logs - credentials in URLs are a security risk.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WebSocketEvent,
  UseWebSocketOptions,
  UseWebSocketReturn,
} from '../websocket/types';
import { DEFAULT_RECONNECT_CONFIG } from '../websocket/types';

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = DEFAULT_RECONNECT_CONFIG.baseDelayMs * 
    Math.pow(DEFAULT_RECONNECT_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, DEFAULT_RECONNECT_CONFIG.maxDelayMs);
}

/**
 * Create WebSocket URL WITHOUT credentials
 * Credentials are passed via subprotocol header, NOT URL!
 */
function createWebSocketUrl(baseUrl: string): string {
  try {
    // Convert http/https to ws/wss
    return baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
  } catch (err) {
    console.error('[WebSocket] Invalid URL:', baseUrl, err);
    return baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
  }
}

/**
 * React hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, credentials, onEvent, reconnect: shouldReconnect = true } = options;
  const { username, password } = credentials;

  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed' | 'error'>('idle');
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current) {
      window.clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  /**
   * Manual reconnect
   */
  const reconnect = useCallback(() => {
    if (isUnmountedRef.current) return;
    console.log('[WebSocket] Manual reconnect requested');
    reconnectAttemptRef.current = 0;
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('idle');
    setTimeout(() => setConnectionState('connecting'), 10);
  }, [clearTimers]);

  /**
   * Main connection effect
   */
  useEffect(() => {
    // Don't connect if no credentials
    if (!username || !password) {
      setError('No credentials provided');
      setConnectionState('error');
      return;
    }

    if (isUnmountedRef.current) return;

    const connect = () => {
      if (isUnmountedRef.current) return;

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionState(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

      try {
        const wsUrl = createWebSocketUrl(url);
        
        // SECURITY: Credentials are sent via Authorization header subprotocol
        // NOT via URL query parameters!
        const credentials = `${username}:${password}`;
        const token = btoa(credentials);
        
        // Use subprotocols to pass auth header
        // Backend expects: Authorization: Basic <token>
        // WebSocket browser API doesn't allow custom headers, so we use protocols
        console.log(`[WebSocket] Connecting to: ${wsUrl.replace(/\/wss?:\/\/[^\/]+/, 'wss://[REDACTED]')}`);

        // Create WebSocket with auth via protocols workaround
        // The server upgrade handler will check the Authorization header
        const ws = new WebSocket(wsUrl, ['clawpanel', token]);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmountedRef.current) return;
          console.log('[WebSocket] Connected');
          setConnectionState('connected');
          setError(null);
          reconnectAttemptRef.current = 0;

          // Start ping interval
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
              pongTimeoutRef.current = window.setTimeout(() => {
                console.warn('[WebSocket] Pong timeout');
                ws.close();
              }, 10000);
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketEvent;
            if (data.type === 'pong') {
              if (pongTimeoutRef.current) {
                window.clearTimeout(pongTimeoutRef.current);
                pongTimeoutRef.current = null;
              }
              return;
            }
            if (!isUnmountedRef.current) {
              setLastEvent(data);
              onEvent?.(data);
            }
          } catch (err) {
            console.error('[WebSocket] Parse error:', err);
          }
        };

        ws.onclose = (event) => {
          if (isUnmountedRef.current) return;
          console.log(`[WebSocket] Closed: code=${event.code}`);
          clearTimers();

          const isAuthFailure = event.code === 1008;
          const maxReached = reconnectAttemptRef.current >= DEFAULT_RECONNECT_CONFIG.maxAttempts;

          if (!event.wasClean && shouldReconnect && !isAuthFailure && !maxReached) {
            const delay = calculateBackoffDelay(reconnectAttemptRef.current);
            console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
            setConnectionState('reconnecting');
            setError(`Reconnecting in ${Math.round(delay / 1000)}s...`);
            reconnectTimeoutRef.current = window.setTimeout(() => {
              reconnectAttemptRef.current++;
              connect();
            }, delay);
          } else {
            setConnectionState('closed');
            if (isAuthFailure) setError('Authentication failed');
            else if (maxReached) setError('Max reconnect attempts reached');
          }
        };

        ws.onerror = () => {
          if (isUnmountedRef.current) return;
          console.error('[WebSocket] Error');
        };

      } catch (err) {
        console.error('[WebSocket] Connection failed:', err);
        setConnectionState('error');
        setError('Connection failed');
      }
    };

    connect();

    return () => {
      isUnmountedRef.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Unmount');
        }
        wsRef.current = null;
      }
    };
  }, [url, username, password, shouldReconnect, onEvent, clearTimers]);

  return {
    isConnected,
    isConnecting,
    lastEvent,
    error,
    reconnect,
  };
}

export default useWebSocket;
