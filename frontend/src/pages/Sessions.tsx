import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  RefreshCw,
  X,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getSessions, killSession } from '../services/sessions';
import type { Session } from '../types';

interface SessionWithMeta extends Session {
  agent?: string;
  model?: string;
  tokens?: number;
  kind?: 'direct' | 'cron' | 'subagent';
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionKey: string;
  isLoading: boolean;
}

const ConfirmKillDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionKey,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Kill Session</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Are you sure you want to terminate this session?
        </p>
        
        <div className="bg-gray-50 p-3 rounded mb-6">
          <p className="text-sm font-mono text-gray-700 break-all">{sessionKey}</p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Killing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Kill Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const REFRESH_INTERVAL = 30000; // 30 seconds

export const Sessions: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionToKill, setSessionToKill] = useState<string | null>(null);

  // Query for fetching sessions
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Mutation for killing sessions
  const killMutation = useMutation({
    mutationFn: killSession,
    onSuccess: () => {
      // Invalidate and refetch sessions after kill
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setSessionToKill(null);
    },
  });

  const handleKillClick = useCallback((sessionKey: string) => {
    setSessionToKill(sessionKey);
  }, []);

  const handleConfirmKill = useCallback(() => {
    if (sessionToKill) {
      killMutation.mutate(sessionToKill);
    }
  }, [sessionToKill, killMutation]);

  const handleCancelKill = useCallback(() => {
    setSessionToKill(null);
  }, []);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Helper to extract kind from session metadata or id
  const getSessionKind = (session: Session): 'direct' | 'cron' | 'subagent' => {
    const id = session.id.toLowerCase();
    if (id.includes('cron') || id.includes('schedule')) return 'cron';
    if (id.includes('subagent') || id.includes('child')) return 'subagent';
    return 'direct';
  };

  // Helper to get badge variant by kind
  const getKindBadgeVariant = (kind: string) => {
    switch (kind) {
      case 'direct':
        return 'default';
      case 'cron':
        return 'warning';
      case 'subagent':
        return 'success';
      default:
        return 'default';
    }
  };

  // Helper to format age
  const getAge = (session: Session): string => {
    return formatDistanceToNow(new Date(session.createdAt), { addSuffix: false });
  };

  // Calculate tokens (using requestCount as proxy)
  const getTokens = (session: Session): number => {
    return session.requestCount || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Active Sessions
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} running
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            )}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading sessions</h3>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error ? error.message : 'Failed to fetch sessions'}
              </p>
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Key
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Kind
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Tokens
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Age
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const kind = getSessionKind(session);
                  return (
                    <tr
                      key={session.key}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {session.key.slice(0, 16)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {session.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getKindBadgeVariant(kind) as any}>
                          {kind}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {getTokens(session).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {getAge(session)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleKillClick(session.key)}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs px-2 py-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Kill
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No active sessions</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Sessions will appear here when agents are running
                      </p>
                    </td>
                  </tr>
                )}
                {isLoading && sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                      <p className="text-gray-500 mt-2">Loading sessions...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          Auto-refreshes every 30 seconds
        </p>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmKillDialog
        isOpen={!!sessionToKill}
        onClose={handleCancelKill}
        onConfirm={handleConfirmKill}
        sessionKey={sessionToKill || ''}
        isLoading={killMutation.isPending}
      />
    </div>
  );
};
