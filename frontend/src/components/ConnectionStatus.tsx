/**
 * ConnectionStatus - WebSocket Connection Status Indicator
 * Issue #22 - WebSocket Real-Time Dashboard (FE-022-3)
 * 
 * Features:
 * - Compact status indicator dot with tooltip
 * - Shows detailed info on click
 * - Reconnect button for disconnected state
 * - Three states: connected (green), connecting (yellow), disconnected (red)
 */
import React, { useState, useCallback } from 'react';
import { Activity, RefreshCw, Wifi, WifiOff, AlertCircle, X } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';
import type { WebSocketEvent } from '../websocket/types';

interface ConnectionStatusProps {
  wsUrl?: string;
  showDetails?: boolean;
  className?: string;
}

const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || 'wss://localhost:3001/ws';

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  wsUrl = DEFAULT_WS_URL,
  showDetails = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);

  // Handle WebSocket events
  const handleEvent = useCallback((event: WebSocketEvent) => {
    if (event.type === 'pong') {
      setLastPingTime(new Date());
    }
  }, []);

  // Connect to WebSocket
  const { isConnected, isConnecting, error, reconnect } = useWebSocket({
    url: wsUrl,
    credentials: {
      username: user || import.meta.env.VITE_WS_USER || 'admin',
      password: import.meta.env.VITE_WS_PASS || 'changeme',
    },
    onEvent: handleEvent,
    reconnect: true,
  });

  // Track reconnect attempts
  const handleReconnect = () => {
    setReconnectCount(prev => prev + 1);
    reconnect();
  };

  // Get status config based on state
  const getStatusConfig = () => {
    if (isConnected) {
      return {
        color: 'bg-green-500',
        pulseColor: 'bg-green-400',
        borderColor: 'border-green-500',
        text: 'Connected',
        textColor: 'text-green-600',
        icon: Wifi,
        tooltip: 'WebSocket connected - Real-time updates active',
      };
    }
    if (isConnecting) {
      return {
        color: 'bg-yellow-500',
        pulseColor: 'bg-yellow-400',
        borderColor: 'border-yellow-500',
        text: 'Connecting...',
        textColor: 'text-yellow-600',
        icon: Activity,
        tooltip: 'Connecting to WebSocket...',
      };
    }
    return {
      color: 'bg-red-500',
      pulseColor: 'bg-red-400',
      borderColor: 'border-red-500',
      text: 'Disconnected',
      textColor: 'text-red-600',
      icon: WifiOff,
      tooltip: 'WebSocket disconnected - Click to reconnect',
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // Format ping time
  const getPingDisplay = () => {
    if (!lastPingTime) return 'No ping yet';
    const ms = Date.now() - lastPingTime.getTime();
    if (ms < 1000) return 'Just now';
    if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
    return `${Math.floor(ms / 60000)}m ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Compact Status Indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors group"
        title={config.tooltip}
      >
        {/* Status Dot with Pulse Animation */}
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
          {(isConnected || isConnecting) && (
            <div 
              className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${config.pulseColor} animate-ping`}
              style={{ animationDuration: isConnecting ? '1s' : '2s' }}
            />
          )}
        </div>
        
        {/* Status Text (hidden on mobile) */}
        <span className={`hidden sm:block text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
        
        {/* Expanded Icon Indicator */}
        <StatusIcon className={`w-4 h-4 ${config.textColor} opacity-0 group-hover:opacity-100 transition-opacity sm:hidden`} />
      </button>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-4 h-4 ${config.textColor}`} />
              <span className="font-medium text-gray-900">Connection Status</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Status Details */}
          <div className="p-4 space-y-3">
            {/* Connection State */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`flex items-center gap-1.5 text-sm font-medium ${config.textColor}`}>
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.text}
              </span>
            </div>

            {/* Last Ping */}
            {isConnected && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Ping</span>
                <span className="text-sm font-medium text-gray-900">
                  {getPingDisplay()}
                </span>
              </div>
            )}

            {/* Reconnect Count */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Reconnects</span>
              <span className="text-sm font-medium text-gray-900">
                {reconnectCount}
              </span>
            </div>

            {/* WebSocket URL */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 block mb-1">Endpoint</span>
              <code className="text-xs font-mono text-gray-700 break-all">
                {wsUrl.replace(/:[^@]+@/, ':***@')}
              </code>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleReconnect}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                {isConnecting ? 'Connecting...' : 'Reconnect'}
              </button>
              
              {!isConnected && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
