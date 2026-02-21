/**
 * useWebSocket - React hook for WebSocket connection management
 * Issue #22 - WebSocket Real-Time Dashboard
 * 
 * Features:
 * - Connect to WSS endpoint with Basic Auth
 * - Exponential backoff reconnect (1s, 2s, 4s, 8s... max 30s)
 * - Max 10 reconnect attempts
 * - Auto-reconnect on unexpected close
 * - Parse incoming JSON events
 * - Send periodic ping (every 25s)
 * - Clean disconnect on unmount
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  WebSocketEvent,
  UseWebSocketOptions,
  UseWebSocketReturn,
  ClientEvent,
  WebSocketConnectionState,
  ReconnectConfig,
  PingPongConfig,
} from '../websocket/types';
import { DEFAULT_RECONNECT_CONFIG, DEFAULT_PING_PONG_CONFIG } from '../websocket/types';

/**
 * Create WebSocket URL with credentials as query params for auth
 * (WebSocket doesn't support headers, so we use query params
 * or include credentials in initial handshake via subprotocols)
 */
function createWebSocketUrl(baseUrl: string, username: string, password: string): string {
  try {
    const wsUrl = baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
    const url = new URL(wsUrl);
    
    // Send credentials as Base64-encoded token in query param
    // Browsers don't reliably send user:pass in WebSocket URL
    const credentials = btoa(`${username}:${password}`);
    url.searchParams.set('token', credentials);
    
    return url.toString();
  } catch (err) {
    console.error('[WebSocket] Invalid URL:', baseUrl, err);
    return baseUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
  }
}

/**
 * Calculate exponential backoff delay
 * Sequence: 1s, 2s, 4s, 8s... capped at maxDelayMs
 */
function calculateBackoffDelay(attempt: number, config: ReconnectConfig): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * React hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  // Destructure options with defaults
  const { url, credentials, onEvent, reconnect: shouldReconnect = true } = options;
  const { username, password } = credentials;

  // State
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('idle');
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for mutable values that don't trigger re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);
  const isConnectingRef = useRef(false);
  const isUnmountedRef = useRef(false);

  // Derived state
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  /**
   * Clear all timers and intervals
   */
  const clearAllTimers = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current !== null) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pongTimeoutRef.current !== null) {
      window.clearTimeout(pongTimeoutRef.current);
      pongTimeoutRef.current = null;
    }
  }, []);

  /**
   * Send ping to server
   */
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const pingEvent: ClientEvent = {
        type: 'ping',
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(pingEvent));

      // Set up pong timeout
      pongTimeoutRef.current = window.setTimeout(() => {
        if (!isUnmountedRef.current) {
          console.warn('[WebSocket] Pong timeout - connection may be stale');
          // Force reconnect
          wsRef.current?.close();
        }
      }, (DEFAULT_PING_PONG_CONFIG as PingPongConfig).pongTimeoutMs);
    }
  }, []);

  /**
   * Start ping interval
   */
  const startPingInterval = useCallback(() => {
    // Clear any existing interval
    if (pingIntervalRef.current !== null) {
      window.clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = window.setInterval(() => {
      sendPing();
    }, (DEFAULT_PING_PONG_CONFIG as PingPongConfig).pingIntervalMs);
  }, [sendPing]);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketEvent;
      
      // Handle pong (clear pong timeout)
      if (data.type === 'pong') {
        if (pongTimeoutRef.current !== null) {
          window.clearTimeout(pongTimeoutRef.current);
          pongTimeoutRef.current = null;
        }
        return;
      }

      // Update last event
      if (!isUnmountedRef.current) {
        setLastEvent(data);
      }

      // Call user handler
      onEvent?.(data);
    } catch (err) {
      console.error('[WebSocket] Failed to parse message:', err);
      if (!isUnmountedRef.current) {
        setError('Failed to parse incoming message');
      }
    }
  }, [onEvent]);

  /**
   * Handle connection open
   */
  const handleOpen = useCallback(() => {
    if (isUnmountedRef.current) return;

    console.log('[WebSocket] Connection established');
    setConnectionState('connected');
    setError(null);
    reconnectAttemptRef.current = 0;
    isConnectingRef.current = false;

    // Start ping interval
    startPingInterval();
  }, [startPingInterval]);

  /**
   * Handle connection close
   */
  const handleClose = useCallback((event: CloseEvent) => {
    if (isUnmountedRef.current) return;

    console.log(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason}`);
    isConnectingRef.current = false;

    // Clear timers
    clearAllTimers();

    // Check if this was a normal close or needs reconnection
    const wasClean = event.wasClean;
    const isAuthFailure = event.code === 1008; // Policy violation (auth failed)
    const maxAttemptsReached = reconnectAttemptRef.current >= (DEFAULT_RECONNECT_CONFIG as ReconnectConfig).maxAttempts;

    if (!wasClean && shouldReconnect && !isAuthFailure && !maxAttemptsReached) {
      // Schedule reconnect with exponential backoff
      const delay = calculateBackoffDelay(reconnectAttemptRef.current, DEFAULT_RECONNECT_CONFIG as ReconnectConfig);
      
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
      setConnectionState('reconnecting');
      setError(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`);

      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isUnmountedRef.current) {
          reconnectAttemptRef.current += 1;
          attemptConnect();
        }
      }, delay);
    } else {
      setConnectionState('closed');
      if (isAuthFailure) {
        setError('Authentication failed - check your credentials');
      } else if (maxAttemptsReached) {
        setError('Max reconnect attempts reached. Please reconnect manually.');
      }
    }
  }, [shouldReconnect, clearAllTimers]);

  /**
   * Handle connection error
   */
  const handleError = useCallback((_event: Event) => {
    if (isUnmountedRef.current) return;

    console.error('[WebSocket] Connection error');
    isConnectingRef.current = false;
    
    // Don't set error here - wait for close event to handle reconnection
  }, []);

  /**
   * Attempt WebSocket connection
   */
  const attemptConnect = useCallback(() => {
    if (isConnectingRef.current) {
      console.log('[WebSocket] Connection already in progress');
      return;
    }

    if (isUnmountedRef.current) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    setConnectionState(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const fullUrl = createWebSocketUrl(url, username, password);
      console.log(`[WebSocket] Connecting to: ${fullUrl}`);
      console.log(`[WebSocket] URL contains token: ${fullUrl.includes('token=')}`);

      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      isConnectingRef.current = false;
      setConnectionState('error');
      setError(err instanceof Error ? err.message : 'Failed to create WebSocket connection');
    }
  }, [url, username, password, handleOpen, handleMessage, handleClose, handleError]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    if (isUnmountedRef.current) return;

    console.log('[WebSocket] Manual reconnect requested');
    reconnectAttemptRef.current = 0;
    clearAllTimers();
    attemptConnect();
  }, [attemptConnect, clearAllTimers]);

  /**
   * Cleanup function - close WebSocket and clear timers
   */
  const cleanup = useCallback(() => {
    console.log('[WebSocket] Cleaning up connection');
    
    // Clear all timers
    clearAllTimers();

    // Mark as closed intentionally (don't auto-reconnect)
    if (wsRef.current) {
      // Remove handlers to prevent callbacks after cleanup
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      // Close connection
      if (wsRef.current.readyState === WebSocket.OPEN || 
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'Client disconnect');
      }
      
      wsRef.current = null;
    }

    isConnectingRef.current = false;
  }, [clearAllTimers]);

  /**
   // Initialize WebSocket connection on mount
   */
  useEffect(() => {
    attemptConnect();

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [attemptConnect, cleanup]);

  /**
   * Reconnect when URL or credentials change
   */
  useEffect(() => {
    if (connectionState !== 'idle') {
      reconnectAttemptRef.current = 0;
      cleanup();
      attemptConnect();
    }
  }, [url, username, password]);

  return {
    isConnected,
    isConnecting,
    lastEvent,
    error,
    reconnect,
  };
}

export default useWebSocket;
