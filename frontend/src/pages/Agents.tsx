import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  RefreshCw,
  X,
  AlertTriangle,
  Trash2,
  Play,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getAgents, spawnAgent, killAgent } from '../services/agents';
import type { Agent } from '../types';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  agentName: string;
  agentId: string;
  isLoading: boolean;
  action: 'kill' | 'spawn';
}

interface SpawnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (task: string) => void;
  agentName: string;
  agentId: string;
  isLoading: boolean;
}

const ConfirmKillDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  agentName,
  agentId,
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
          <h2 className="text-xl font-semibold text-gray-900">Kill Agent</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to terminate all sessions for this agent?
        </p>

        <div className="bg-gray-50 p-3 rounded mb-6">
          <p className="text-sm font-medium text-gray-700">{agentName}</p>
          <p className="text-xs font-mono text-gray-500">{agentId}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
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
                Kill Agent
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const SpawnAgentModal: React.FC<SpawnModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  agentName,
  agentId,
  isLoading,
}) => {
  const [task, setTask] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      onConfirm(task.trim());
    }
  };

  const handleClose = () => {
    setTask('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-full">
            <Play className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Spawn Agent</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Start a new session with this agent:
        </p>

        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm font-medium text-gray-700">{agentName}</p>
          <p className="text-xs font-mono text-gray-500">{agentId}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="task-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Task Description
            </label>
            <textarea
              id="task-input"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the task you want the agent to perform..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-y"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading || !task.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Spawning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Spawn Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const REFRESH_INTERVAL = 30000; // 30 seconds

// Helper to get status badge variant
const getStatusBadgeVariant = (
  status: string
): 'default' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'running':
      return 'success';
    case 'idle':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

// Helper to extract emoji from agent identityEmoji or fallback patterns
const getAgentEmoji = (agent: Agent): string => {
  // Use identityEmoji if available
  if (agent.identityEmoji) {
    return agent.identityEmoji;
  }
  // Fallback emojis based on agent name patterns
  const name = agent.identityName.toLowerCase();
  if (name.includes('frontend')) return '🎨';
  if (name.includes('backend')) return '⚙️';
  if (name.includes('dev')) return '💻';
  if (name.includes('ops')) return '🔧';
  if (name.includes('data')) return '📊';
  if (name.includes('test')) return '🧪';
  return '🤖';
};

// Helper to get model info (direct property)
const getAgentModel = (agent: Agent): string => {
  return agent.model || 'default';
};

// Helper to get workspace info (direct property)
const getAgentWorkspace = (agent: Agent): string => {
  return agent.workspace || 'default';
};

export const Agents: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [agentToKill, setAgentToKill] = useState<Agent | null>(null);
  const [agentToSpawn, setAgentToSpawn] = useState<Agent | null>(null);

  // Query for fetching agents
  const {
    data: agents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Mutation for spawning agents
  const spawnMutation = useMutation({
    mutationFn: ({ id, task }: { id: string; task: string }) =>
      spawnAgent(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setAgentToSpawn(null);
    },
  });

  // Mutation for killing agents
  const killMutation = useMutation({
    mutationFn: killAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setAgentToKill(null);
    },
  });

  const handleSpawnClick = useCallback((agent: Agent) => {
    setAgentToSpawn(agent);
  }, []);

  const handleKillClick = useCallback((agent: Agent) => {
    setAgentToKill(agent);
  }, []);

  const handleConfirmSpawn = useCallback(
    (task: string) => {
      if (agentToSpawn) {
        spawnMutation.mutate({ id: agentToSpawn.id, task });
      }
    },
    [agentToSpawn, spawnMutation]
  );

  const handleConfirmKill = useCallback(() => {
    if (agentToKill) {
      killMutation.mutate(agentToKill.id);
    }
  }, [agentToKill, killMutation]);

  const handleCancelKill = useCallback(() => {
    setAgentToKill(null);
  }, []);

  const handleCancelSpawn = useCallback(() => {
    setAgentToSpawn(null);
  }, []);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

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
                Agents
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
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
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading agents</h3>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error
                  ? error.message
                  : 'Failed to fetch agents'}
              </p>
            </div>
          </div>
        )}

        {/* Agents Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Model
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Workspace
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Updated
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {agent.id}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getAgentEmoji(agent)}
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {agent.identityName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(agent.status)}>
                        {agent.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {getAgentModel(agent)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {getAgentWorkspace(agent)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(agent.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSpawnClick(agent)}
                          disabled={spawnMutation.isPending}
                          className="text-xs px-2 py-1"
                        >
                          {spawnMutation.isPending &&
                          agentToSpawn?.id === agent.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Spawn
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleKillClick(agent)}
                          disabled={killMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs px-2 py-1"
                        >
                          {killMutation.isPending &&
                          agentToKill?.id === agent.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Kill
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No agents configured
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Agents will appear here once they are registered
                      </p>
                    </td>
                  </tr>
                )}
                {isLoading && agents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                      <p className="text-gray-500 mt-2">Loading agents...</p>
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

      {/* Spawn Modal */}
      <SpawnAgentModal
        isOpen={!!agentToSpawn}
        onClose={handleCancelSpawn}
        onConfirm={handleConfirmSpawn}
        agentName={agentToSpawn?.identityName || ''}
        agentId={agentToSpawn?.id || ''}
        isLoading={spawnMutation.isPending}
      />

      {/* Kill Confirmation Dialog */}
      <ConfirmKillDialog
        isOpen={!!agentToKill}
        onClose={handleCancelKill}
        onConfirm={handleConfirmKill}
        agentName={agentToKill?.identityName || ''}
        agentId={agentToKill?.id || ''}
        isLoading={killMutation.isPending}
        action="kill"
      />
    </div>
  );
};
