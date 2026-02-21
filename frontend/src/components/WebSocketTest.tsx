/**
 * WebSocketTest - Test component for WebSocket connection
 * Issue #22 - WebSocket Real-Time Dashboard
 * 
 * Features:
 * - Display connection status
 * - Show last received event
 * - Manual reconnect button
 * - Event log display
 */
import React, { useState, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import type { WebSocketEvent } from '../websocket/types';

interface WebSocketTestProps {
  wsUrl?: string;
}

const DEFAULT_WS_URL = 'wss://localhost:3001/ws';

export const WebSocketTest: React.FC<WebSocketTestProps> = ({ wsUrl = DEFAULT_WS_URL }) => {
  // Get auth credentials
  const { user } = useAuth();
  
  // Event log for display
  const [eventLog, setEventLog] = useState<Array<{ 
    id: string; 
    event: WebSocketEvent; 
    receivedAt: Date 
  }>>([]);

  // Handle incoming WebSocket event
  const handleEvent = useCallback((event: WebSocketEvent) => {
    console.log('[WebSocketTest] Received event:', event);
    
    setEventLog(prev => {
      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        event,
        receivedAt: new Date(),
      };
      // Keep only last 20 events
      return [newEntry, ...prev].slice(0, 20);
    });
  }, []);

  // Use the WebSocket hook
  // Note: We need credentials. Since useAuth only stores the token, 
  // we'll use environment defaults or prompt if needed
  const { isConnected, isConnecting, lastEvent, error, reconnect } = useWebSocket({
    url: wsUrl,
    credentials: {
      // Try to get from localStorage or use defaults
      // In a real app, you'd store raw credentials securely
      username: user || import.meta.env.VITE_WS_USER || 'admin',
      password: import.meta.env.VITE_WS_PASS || 'changeme',
    },
    onEvent: handleEvent,
    reconnect: true,
  });

  // Format event for display
  const formatEvent = (event: WebSocketEvent): string => {
    return JSON.stringify(event, null, 2);
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  // Get status badge color
  const getStatusColor = (): string => {
    if (error) return 'bg-red-100 text-red-800';
    if (isConnecting) return 'bg-yellow-100 text-yellow-800';
    if (isConnected) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get status text
  const getStatusText = (): string => {
    if (error) return 'Error';
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">WebSocket Connection Test</h2>
          
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            
            <button
              onClick={reconnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Reconnect'}
            </button>
          </div>
        </div>

        {/* Connection Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Connection Details</h3>
          <div className="bg-gray-50 rounded-md p-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">URL: </span>
                <span className="font-mono text-gray-700" title={wsUrl}>
                  {wsUrl.length > 40 ? `${wsUrl.substring(0, 40)}...` : wsUrl}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Username: </span>
                <span className="font-mono text-gray-700">{user || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Event */}
        {lastEvent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Last Event</h3>
            <pre className="bg-gray-50 rounded-md p-4 text-sm font-mono text-gray-700 overflow-x-auto">
              {formatEvent(lastEvent)}
            </pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Event Log */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Event Log ({eventLog.length} events)</h3>
        
        {eventLog.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No events received yet...
          </div>
        ) : (
          <div className="space-y-3">
            {eventLog.map(({ id, event, receivedAt }) => (
              <div key={id} className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Received at {formatTime(receivedAt)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTime(new Date(event.timestamp))}
                  </span>
                </div>
                <pre className="p-4 text-xs font-mono text-gray-700 overflow-x-auto max-h-32 overflow-y-auto">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketTest;
