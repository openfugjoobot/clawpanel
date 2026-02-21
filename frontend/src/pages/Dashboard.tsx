import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  Bot, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  ArrowRight,
  Github,
  Settings,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getGatewayStatus } from '../services/gateway';
import { getSessions } from '../services/sessions';
import { getAgents } from '../services/agents';
import { getCronJobs } from '../services/cron';
import { useAuth } from '../context/AuthContext';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';
import type { GatewayStatus, Session, Agent, CronJob } from '../types';

// =============================================================================
// Dashboard Content Component (uses context)
// =============================================================================

interface DashboardState {
  error: string | null;
  loading: boolean;
}

const REFRESH_INTERVAL = 30000; // 30 seconds
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

/**
 * Inner Dashboard component that uses the Dashboard context
 */
const DashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const 
  const [state, setState] = useState<DashboardState>({
    error: null,
    loading: false,
  });

  // Get data and status from context
  const {
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
  } = useDashboard();

  // Derived state
  const loading = state.loading || wsConnecting;
  const error = state.error || wsError;

  // Manual refresh (combines polling fallback)
  const handleManualRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await refreshData();
      setState(prev => ({ ...prev, loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to refresh data',
      }));
    }
  }, [refreshData]);

  // Auto-refresh every 30 seconds (kept as fallback)
  useEffect(() => {
    const interval = setInterval(handleManualRefresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [handleManualRefresh]);

  // Format uptime from seconds
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get gateway status icon
  const getGatewayStatusIcon = (status?: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />;
    }
  };

  // Count agents by status
  const runningAgents = agents.filter(a => a.status === 'running').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  // Pulse animation class helper
  const getPulseClass = (section: 'gateway' | 'sessions' | 'agents' | 'cron') => {
    if (!liveUpdate) return '';
    return 'ring-2 ring-blue-500/50 animate-pulse';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ClawPanel Dashboard</h1>
            {user && <p className="text-sm text-gray-600 mt-1">Welcome back, <span className="font-medium">{user}</span></p>}
            <div className="flex items-center gap-3 mt-2">
              {lastUpdateTime && (
                <p className="text-sm text-gray-500">
                  Last updated {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
                </p>
              )}
              {liveUpdate && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 animate-pulse">
                  <Zap className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* WebSocket Status Indicator */}
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
              ${wsConnected 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : wsConnecting 
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }
            `}>
              {wsConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>WebSocket</span>
              <Badge 
                variant={wsConnected ? 'success' : wsConnecting ? 'warning' : 'error'} 
                className="text-xs ml-1"
              >
                {wsConnected ? 'Connected' : wsConnecting ? 'Connecting...' : 'Disconnected'}
              </Badge>
            </div>

            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>

            {/* Reconnect button if disconnected */}
            {!wsConnected && !wsConnecting && (
              <Button
                variant="primary"
                onClick={reconnectWebSocket}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Wifi className="w-4 h-4" />
                Reconnect
              </Button>
            )}

            <Button 
              variant="secondary" 
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading dashboard data</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button 
                onClick={handleManualRefresh}
                className="text-sm text-red-700 underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Gateway Status Card */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Gateway Status
              </div>
            }
            className={`relative overflow-hidden transition-all duration-300 ${getPulseClass('gateway')}`}
          >
            <div className="p-1">
              <div className="flex items-center gap-3 mb-3">
                {getGatewayStatusIcon(gatewayStatus?.status)}
                <span className={`text-lg font-semibold capitalize ${
                  gatewayStatus?.status === 'online' ? 'text-green-600' : 
                  gatewayStatus?.status === 'offline' ? 'text-red-600' : 
                  gatewayStatus?.status === 'error' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {gatewayStatus?.status || 'Loading...'}
                </span>
              </div>
              {gatewayStatus && (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Version: <span className="font-medium">{gatewayStatus.version}</span></p>
                  <p>PID: <span className="font-medium">{gatewayStatus.pid}</span></p>
                  <p>Uptime: <span className="font-medium">{formatUptime(gatewayStatus.uptime)}</span></p>
                </div>
              )}
              {!gatewayStatus && !loading && (
                <p className="text-sm text-gray-500">Gateway data unavailable</p>
              )}
            </div>
          </Card>

          {/* Sessions Card */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Sessions
              </div>
            }
            className={`cursor-pointer hover:shadow-lg transition-shadow group transition-all duration-300 ${getPulseClass('sessions')}`}
            onClick={() => navigate('/sessions')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : sessions.length}
                </span>
                <span className="text-sm text-gray-500">sessions</span>
              </div>
              {sessions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.key} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[120px]">{session.id}</span>
                      <span className="text-gray-400">
                        {session.requestCount} req
                      </span>
                    </div>
                  ))}
                  {sessions.length > 3 && (
                    <p className="text-xs text-gray-400 mt-2">
                      +{sessions.length - 3} more sessions
                    </p>
                  )}
                </div>
              )}
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View all sessions</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>

          {/* Agents Card */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Agents
              </div>
            }
            className={`cursor-pointer hover:shadow-lg transition-shadow group transition-all duration-300 ${getPulseClass('agents')}`}
            onClick={() => navigate('/agents')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : agents.length}
                </span>
                <span className="text-sm text-gray-500">total</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="text-lg font-semibold text-green-600">{runningAgents}</p>
                  <p className="text-xs text-green-700">running</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-lg font-semibold text-blue-600">{idleAgents}</p>
                  <p className="text-xs text-blue-700">idle</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-lg font-semibold text-red-600">{errorAgents}</p>
                  <p className="text-xs text-red-700">error</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View all agents</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>

          {/* Cron Jobs Card */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Cron Jobs
              </div>
            }
            className={`cursor-pointer hover:shadow-lg transition-shadow group transition-all duration-300 ${getPulseClass('cron')}`}
            onClick={() => navigate('/cron')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loading ? '-' : cronJobs.length}
                </span>
                <span className="text-sm text-gray-500">jobs</span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded text-center">
                <p className="text-sm text-gray-500">Scheduled tasks</p>
                <p className="text-xs text-gray-400 mt-1">Manage cron jobs</p>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View all jobs</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>

          {/* GitHub Card */}
          <Card 
            title={
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </div>
            }
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate('/github')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  Issues &amp; PRs
                </span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded text-center">
                <p className="text-sm text-gray-500">openclaw/clawpanel</p>
                <p className="text-xs text-gray-400 mt-1">View on GitHub</p>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View repository</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>

          {/* Settings Card */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Config
              </div>
            }
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate('/settings')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-bold text-gray-900">
                  Settings
                </span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded text-center">
                <p className="text-sm text-gray-500">openclaw.json</p>
                <p className="text-xs text-gray-400 mt-1">Edit configuration</p>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                <span>View settings</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </div>

        {/* WebSocket Status Footer */}
        <div className="mt-8" data-testid="websocket-status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="WebSocket Status">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Connection: 
                  <span className={`font-medium ml-1 ${
                    wsConnected ? 'text-green-600' : 
                    wsConnecting ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {wsConnected ? 'Connected' : 
                     wsConnecting ? 'Connecting...' : 'Disconnected'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Live Updates: 
                  <span className={`font-medium ml-1 ${
                    wsConnected ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {wsConnected ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Auto-refresh: 
                  <span className="text-green-600 font-medium">Active (30s fallback)</span>
                </p>
              </div>
            </Card>

            <Card title="Quick Actions">
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleManualRefresh}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh Data
                </Button>
                {!wsConnected && (
                  <Button 
                    variant="secondary" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={reconnectWebSocket}
                  >
                    <Wifi className="w-4 h-4" />
                    Reconnect WebSocket
                  </Button>
                )}
                <Button variant="outline" className="w-full" disabled>
                  View Logs
                </Button>
              </div>
            </Card>

            <Card title="Resources">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">CPU: <span className="font-medium">--%</span></p>
                <p className="text-sm text-gray-600">Memory: <span className="font-medium">--%</span></p>
                <p className="text-sm text-gray-600">Disk: <span className="font-medium">--%</span></p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Dashboard Container (Provider wrapper)
// =============================================================================

/**
 * Fetches initial data for the dashboard
 */
const fetchInitialData = async (): Promise<{
  sessions: Session[];
  agents: Agent[];
  cronJobs: CronJob[];
  gateway: GatewayStatus | null;
}> => {
  const [gatewayData, sessionsData, agentsData, cronJobsData] = await Promise.allSettled([
    getGatewayStatus(),
    getSessions(),
    getAgents(),
    getCronJobs(),
  ]);

  return {
    gateway: gatewayData.status === 'fulfilled' ? gatewayData.value : null,
    sessions: sessionsData.status === 'fulfilled' ? sessionsData.value : [],
    agents: agentsData.status === 'fulfilled' ? agentsData.value : [],
    cronJobs: cronJobsData.status === 'fulfilled' ? cronJobsData.value : [],
  };
};

/**
 * Dashboard component with WebSocket support
 * Wraps DashboardContent with DashboardProvider
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // WebSocket URL from config
  const wsUrl = useMemo(() => {
    // Convert HTTP endpoint to WSS/WS
    return API_BASE_URL.replace(/^https?:\/\//, (match) => 
      match.startsWith('https') ? 'wss://' : 'ws://'
    ) + '/ws';
  }, []);

  // WebSocket credentials from localStorage or environment
  const wsCredentials = useMemo(() => {
    try {
      const stored = localStorage.getItem('clawpanel_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          username: parsed.username || 'admin',
          password: parsed.password || '',
        };
      }
    } catch {
      // Ignore parse errors
    }
    return {
      username: 'admin',
      password: '',
    };
  }, []);

  return (
    <DashboardProvider
      wsUrl={wsUrl}
      wsCredentials={wsCredentials}
      initialLoad={fetchInitialData}
    >
      <DashboardContent />
    </DashboardProvider>
  );
};

export default Dashboard;
