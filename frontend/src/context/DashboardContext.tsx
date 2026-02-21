/**
 * Dashboard WebSocket Context
 * Issue #22 - WebSocket Real-Time Dashboard (FE-022-2)
 * 
 * Provides real-time dashboard state updates via WebSocket events.
 * Tracks: sessions, agents, cronJobs, gatewayStatus
 */
import React, { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { 
  WebSocketEvent, 
  SessionCreatedPayload, 
  SessionKilledPayload, 
  AgentStatusPayload,
  CronExecutedPayload,
  GatewayStatusPayload 
} from '../websocket/types';
import type { Session, Agent, CronJob, GatewayStatus } from '../types';

// =============================================================================
// Context Types
// =============================================================================

interface DashboardContextValue {
  // Data
  sessions: Session[];
  agents: Agent[];
  cronJobs: CronJob[];
  gatewayStatus: GatewayStatus | null;
  
  // Connection State
  wsConnected: boolean;
  wsConnecting: boolean;
  wsError: string | null;
  
  // Live Activity
  liveUpdate: boolean;
  lastUpdateTime: Date | null;
  
  // Actions
  refreshData: () => Promise<void>;
  reconnectWebSocket: () => void;
}

interface DashboardProviderProps {
  children: React.ReactNode;
  wsUrl: string;
  wsCredentials: { username: string; password: string };
  initialLoad: () => Promise<{
    sessions: Session[];
    agents: Agent[];
    cronJobs: CronJob[];
    gateway: GatewayStatus | null;
  }>;
}

// =============================================================================
// Context Creation
// =============================================================================

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboard = (): DashboardContextValue => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// =============================================================================
// Helper Types for Pulsing Effect
// =============================================================================

interface PulsingState {
  sessions: boolean;
  agents: boolean;
  cronJobs: boolean;
  gateway: boolean;
}

// =============================================================================
// Provider Implementation
// =============================================================================

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  wsUrl,
  wsCredentials,
  initialLoad,
}) => {
  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [liveUpdate, setLiveUpdate] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  // Pulsing state for visual indicators
  const [_pulsing, setPulsing] = useState<PulsingState>({
    sessions: false,
    agents: false,
    cronJobs: false,
    gateway: false,
  });
  
  // Refs for pulsing timeouts
  const pulseTimeoutRef = useRef<number | null>(null);
  
  /**
   * Trigger a pulse effect on a specific section
   */
  const triggerPulse = useCallback((section: keyof PulsingState) => {
    setPulsing(prev => ({ ...prev, [section]: true }));
    setLiveUpdate(true);
    setLastUpdateTime(new Date());
    
    // Clear any existing timeout
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
    
    // Clear pulse after 2 seconds
    pulseTimeoutRef.current = window.setTimeout(() => {
      setPulsing(prev => ({ ...prev, [section]: false }));
      setLiveUpdate(false);
    }, 2000);
  }, []);
  
  /**
   * Handle incoming WebSocket events
   */
  const handleWebSocketEvent = useCallback((event: WebSocketEvent) => {
    console.log('[DashboardContext] Received WebSocket event:', event.type, event.payload);
    
    switch (event.type) {
      case 'session.created': {
        const payload = event.payload as SessionCreatedPayload;
        setSessions(prev => {
          // Check if session already exists (avoid duplicates)
          if (prev.some(s => s.key === payload.sessionKey)) {
            return prev;
          }
          const newSession: Session = {
            key: payload.sessionKey,
            id: payload.agentId + '-' + payload.sessionKey.slice(-6),
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            requestCount: 0,
            metadata: { kind: payload.kind, label: payload.label },
          };
          return [...prev, newSession];
        });
        triggerPulse('sessions');
        break;
      }
      
      case 'session.killed': {
        const payload = event.payload as SessionKilledPayload;
        setSessions(prev => prev.filter(s => s.key !== payload.sessionKey));
        triggerPulse('sessions');
        break;
      }
      
      case 'agent.status': {
        const payload = event.payload as AgentStatusPayload;
        setAgents(prev => prev.map(a => 
          a.id === payload.agentId 
            ? { 
                ...a, 
                status: payload.status,
                updatedAt: payload.lastActivity || new Date().toISOString(),
              } 
            : a
        ));
        triggerPulse('agents');
        break;
      }
      
      case 'cron.executed': {
        const payload = event.payload as CronExecutedPayload;
        setCronJobs(prev => prev.map(job => 
          job.id === payload.jobId 
            ? { 
                ...job, 
                lastRun: new Date().toISOString(),
                status: payload.exitCode === 0 ? 'ok' : 'error',
              } 
            : job
        ));
        triggerPulse('cronJobs');
        break;
      }
      
      case 'gateway.status': {
        const payload = event.payload as GatewayStatusPayload;
        setGatewayStatus({
          status: payload.status === 'running' ? 'online' : 
                  payload.status === 'error' ? 'error' : 'offline',
          version: payload.version,
          uptime: payload.uptime,
          pid: gatewayStatus?.pid || 0,
          startedAt: gatewayStatus?.startedAt || new Date().toISOString(),
        });
        triggerPulse('gateway');
        break;
      }
      
      default:
        console.log('[DashboardContext] Unhandled event type:', event.type);
    }
  }, [gatewayStatus, triggerPulse]);
  
  // WebSocket connection
  const { 
    isConnected: wsConnected, 
    isConnecting: wsConnecting, 
    error: wsError,
    reconnect: reconnectWebSocket 
  } = useWebSocket({
    url: wsUrl,
    credentials: wsCredentials,
    onEvent: handleWebSocketEvent,
    reconnect: true,
  });
  
  /**
   * Initial data load via REST API
   */
  const loadInitialData = useCallback(async () => {
    try {
      const data = await initialLoad();
      setSessions(data.sessions);
      setAgents(data.agents);
      setCronJobs(data.cronJobs);
      setGatewayStatus(data.gateway);
      setLastUpdateTime(new Date());
    } catch (err) {
      console.error('[DashboardContext] Failed to load initial data:', err);
    }
  }, [initialLoad]);
  
  /**
   * Refresh all data (manual fallback)
   */
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);
  
  // Initial load
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // Cleanup pulse timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);
  
  // Provide context value
  const value: DashboardContextValue = {
    sessions,
    agents,
    cronJobs,
    gatewayStatus,
    wsConnected,
    wsConnecting,
    wsError,
    liveUpdate,
    lastUpdateTime,
    refreshData,
    reconnectWebSocket,
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardProvider;
