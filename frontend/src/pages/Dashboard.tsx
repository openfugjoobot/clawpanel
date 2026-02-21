import React, { useEffect, useState, useCallback } from 'react';
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
  FolderOpen,
  Settings
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
import type { GatewayStatus, Session, Agent } from '../types';

interface DashboardData {
  gateway: GatewayStatus | null;
  sessions: Session[];
  agents: Agent[];
  cronJobs: number;
}

interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    data: {
      gateway: null,
      sessions: [],
      agents: [],
      cronJobs: 0,
    },
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [gatewayData, sessionsData, agentsData, cronJobsData] = await Promise.all([
        getGatewayStatus().catch(() => null),
        getSessions().catch(() => []),
        getAgents().catch(() => []),
        getCronJobs().catch(() => []),
      ]);

      setState({
        data: {
          gateway: gatewayData,
          sessions: sessionsData,
          agents: agentsData,
          cronJobs: cronJobsData.length,
        },
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch dashboard data',
      }));
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

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
  const runningAgents = state.data.agents.filter(a => a.status === 'running').length;
  const idleAgents = state.data.agents.filter(a => a.status === 'idle').length;
  const errorAgents = state.data.agents.filter(a => a.status === 'error').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ClawPanel Dashboard</h1>
            {user && <p className="text-sm text-gray-600 mt-1">Welcome back, <span className="font-medium">{user}</span></p>}
            {state.lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated {formatDistanceToNow(state.lastUpdated, { addSuffix: true })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              disabled={state.loading}
              className="flex items-center gap-2"
            >
              {state.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
            <Badge variant="success">Online</Badge>
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
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading dashboard data</h3>
              <p className="text-sm text-red-600 mt-1">{state.error}</p>
              <button 
                onClick={fetchDashboardData}
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
            className="relative overflow-hidden"
          >
            <div className="p-1">
              <div className="flex items-center gap-3 mb-3">
                {getGatewayStatusIcon(state.data.gateway?.status)}
                <span className={`text-lg font-semibold capitalize ${
                  state.data.gateway?.status === 'online' ? 'text-green-600' : 
                  state.data.gateway?.status === 'offline' ? 'text-red-600' : 
                  state.data.gateway?.status === 'error' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {state.data.gateway?.status || 'Loading...'}
                </span>
              </div>
              {state.data.gateway && (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Version: <span className="font-medium">{state.data.gateway.version}</span></p>
                  <p>PID: <span className="font-medium">{state.data.gateway.pid}</span></p>
                  <p>Uptime: <span className="font-medium">{formatUptime(state.data.gateway.uptime)}</span></p>
                </div>
              )}
              {!state.data.gateway && !state.loading && (
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
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate('/sessions')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {state.loading ? '-' : state.data.sessions.length}
                </span>
                <span className="text-sm text-gray-500">sessions</span>
              </div>
              {state.data.sessions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {state.data.sessions.slice(0, 3).map((session) => (
                    <div key={session.key} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[120px]">{session.id}</span>
                      <span className="text-gray-400">
                        {session.requestCount} req
                      </span>
                    </div>
                  ))}
                  {state.data.sessions.length > 3 && (
                    <p className="text-xs text-gray-400 mt-2">
                      +{state.data.sessions.length - 3} more sessions
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
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate('/agents')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900">
                  {state.loading ? '-' : state.data.agents.length}
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
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate('/cron')}
          >
            <div className="p-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {state.loading ? '-' : state.data.cronJobs}
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
                  Issues & PRs
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

        {/* Legacy Content (for reference) */}
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="System Status">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  API Server: 
                  <span className={`font-medium ml-1 ${state.error ? 'text-red-600' : 'text-green-600'}`}>
                    {state.error ? 'Error' : 'Running'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  WebSocket: 
                  <span className="text-gray-400 font-medium">Not implemented</span>
                </p>
                <p className="text-sm text-gray-600">
                  Auto-refresh: 
                  <span className="text-green-600 font-medium">Active (30s)</span>
                </p>
              </div>
            </Card>

            <Card title="Quick Actions">
              <div className="space-y-3">
                <Button variant="primary" className="w-full" onClick={fetchDashboardData}>
                  Refresh Data
                </Button>
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
