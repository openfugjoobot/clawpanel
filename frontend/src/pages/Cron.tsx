import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Plus,
  ArrowLeft,
  Loader2,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getCronJobs, createCronJob, deleteCronJob } from '../services/cron';
import { getAgents } from '../services/agents';
import type { CronJob, Agent } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; schedule: string; command: string; agent: string }) => void;
  agents: Agent[];
  isLoading: boolean;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobName: string;
  isLoading: boolean;
}

const REFRESH_INTERVAL = 60000; // 60 seconds

// Helper to parse cron schedule to human-readable text
const formatSchedule = (schedule: string): string => {
  if (!schedule) return 'Invalid schedule';
  
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Common patterns
  if (schedule === '* * * * *') return 'Every minute';
  if (schedule === '*/5 * * * *') return 'Every 5 minutes';
  if (schedule === '*/10 * * * *') return 'Every 10 minutes';
  if (schedule === '*/15 * * * *') return 'Every 15 minutes';
  if (schedule === '*/30 * * * *') return 'Every 30 minutes';
  if (schedule === '0 * * * *') return 'Every hour';
  if (schedule === '0 */2 * * *') return 'Every 2 hours';
  if (schedule === '0 */6 * * *') return 'Every 6 hours';
  if (schedule === '0 */12 * * *') return 'Every 12 hours';
  if (schedule === '0 0 * * *') return 'Daily at midnight';
  if (schedule === '0 12 * * *') return 'Daily at noon';
  if (schedule === '0 0 * * 0') return 'Every Sunday at midnight';
  if (schedule === '0 0 * * 1') return 'Every Monday at midnight';
  if (schedule === '0 0 1 * *') return 'Monthly on the 1st';
  
  // Custom interpretation
  if (minute.startsWith('*/')) {
    const interval = minute.replace('*/', '');
    return `Every ${interval} minutes`;
  }
  if (hour.startsWith('*/')) {
    const interval = hour.replace('*/', '');
    return `Every ${interval} hours`;
  }
  if (minute === '0' && hour !== '*') {
    return `Daily at ${hour.padStart(2, '0')}:00`;
  }
  
  return schedule; // fallback to raw format
};

// Helper to get status badge variant
const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'ok':
      return 'success';
    case 'error':
      return 'error';
    case 'pending':
    default:
      return 'warning';
  }
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobName,
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
          <h2 className="text-xl font-semibold text-gray-900">Delete Cron Job</h2>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this cron job? This action cannot be undone.
        </p>

        <div className="bg-gray-50 p-3 rounded mb-6">
          <p className="text-sm font-medium text-gray-700">{jobName}</p>
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
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CreateCronJobModal: React.FC<CreateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  agents,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    command: '',
    agent: '',
  });
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.schedule.trim() && formData.command.trim() && formData.agent) {
      onConfirm({
        name: formData.name.trim(),
        schedule: formData.schedule.trim(),
        command: formData.command.trim(),
        agent: formData.agent,
      });
    }
  };

  const handleClose = () => {
    setFormData({ name: '', schedule: '', command: '', agent: '' });
    setShowHelp(false);
    onClose();
  };

  const cronExamples = [
    { schedule: '* * * * *', desc: 'Every minute' },
    { schedule: '*/5 * * * *', desc: 'Every 5 minutes' },
    { schedule: '*/15 * * * *', desc: 'Every 15 minutes' },
    { schedule: '0 * * * *', desc: 'Every hour' },
    { schedule: '0 0 * * *', desc: 'Daily at midnight' },
    { schedule: '0 0 * * 0', desc: 'Every Sunday' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Create Cron Job</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="cron-name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cron-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Daily Report Generator"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            {/* Schedule Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="cron-schedule" className="block text-sm font-medium text-gray-700">
                  Schedule (Cron) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  {showHelp ? 'Hide Help' : 'Show Help'}
                </button>
              </div>
              <input
                id="cron-schedule"
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="*/30 * * * *"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                disabled={isLoading}
                required
              />
              {showHelp && (
                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Format: minute hour day month weekday</p>
                  <div className="space-y-1">
                    {cronExamples.map((ex) => (
                      <button
                        key={ex.schedule}
                        type="button"
                        onClick={() => setFormData({ ...formData, schedule: ex.schedule })}
                        className="w-full text-left text-xs px-2 py-1 hover:bg-gray-100 rounded flex justify-between items-center"
                      >
                        <code className="font-mono text-blue-600">{ex.schedule}</code>
                        <span className="text-gray-500">{ex.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agent Field */}
            <div>
              <label htmlFor="cron-agent" className="block text-sm font-medium text-gray-700 mb-2">
                Agent <span className="text-red-500">*</span>
              </label>
              <select
                id="cron-agent"
                value={formData.agent}
                onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              >
                <option value="">Select an agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Command Field */}
            <div>
              <label htmlFor="cron-command" className="block text-sm font-medium text-gray-700 mb-2">
                Command <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cron-command"
                value={formData.command}
                onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                placeholder="Task description or command to execute..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
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
              disabled={isLoading || !formData.name.trim() || !formData.schedule.trim() || !formData.command.trim() || !formData.agent}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Cron: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [jobToDelete, setJobToDelete] = useState<CronJob | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch agents for the create modal
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  // Query for fetching cron jobs
  const {
    data: cronJobs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cron'],
    queryFn: getCronJobs,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  // Mutation for creating cron jobs
  const createMutation = useMutation({
    mutationFn: createCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron'] });
      setIsCreateModalOpen(false);
    },
  });

  // Mutation for deleting cron jobs
  const deleteMutation = useMutation({
    mutationFn: deleteCronJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron'] });
      setJobToDelete(null);
    },
  });

  const handleCreateClick = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((job: CronJob) => {
    setJobToDelete(job);
  }, []);

  const handleConfirmCreate = useCallback(
    (data: { name: string; schedule: string; command: string; agent: string }) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  const handleConfirmDelete = useCallback(() => {
    if (jobToDelete) {
      deleteMutation.mutate(jobToDelete.id);
    }
  }, [jobToDelete, deleteMutation]);

  const handleCancelDelete = useCallback(() => {
    setJobToDelete(null);
  }, []);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Format last run
  const formatLastRun = (job: CronJob): string => {
    if (!job.lastRun) return 'Never';
    return formatDistanceToNow(new Date(job.lastRun), { addSuffix: true });
  };

  // Format next run
  const formatNextRun = (job: CronJob): string => {
    if (!job.nextRun) return 'Calculating...';
    const nextDate = new Date(job.nextRun);
    if (nextDate < new Date()) return 'Pending...';
    return formatDistanceToNow(nextDate, { addSuffix: true });
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
                Cron Jobs
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {cronJobs.length} job{cronJobs.length !== 1 ? 's' : ''} scheduled
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
            <Button
              variant="primary"
              onClick={handleCreateClick}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Job
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {isError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading cron jobs</h3>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error
                  ? error.message
                  : 'Failed to fetch cron jobs'}
              </p>
            </div>
          </div>
        )}

        {/* Cron Jobs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Schedule
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Next Run
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Last Run
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {cronJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {job.name}
                          </span>
                          <code className="block text-xs text-gray-500 font-mono mt-0.5">
                            {job.agent}
                          </code>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">
                          {formatSchedule(job.schedule)}
                        </span>
                        <code className="text-xs text-gray-400 font-mono">
                          {job.schedule}
                        </code>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatNextRun(job)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatLastRun(job)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status === 'ok' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            ok
                          </span>
                        ) : job.status === 'error' ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            error
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            pending
                          </span>
                        )}
                      </Badge>
                      {job.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 truncate max-w-[150px]">
                          {job.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteClick(job)}
                        disabled={deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs px-2 py-1"
                      >
                        {deleteMutation.isPending && jobToDelete?.id === job.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
                {cronJobs.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No cron jobs configured
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Create your first scheduled task
                      </p>
                      <div className="mt-4">
                        <Button
                          variant="primary"
                          onClick={handleCreateClick}
                          className="flex items-center gap-2 mx-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Create Job
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {isLoading && cronJobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
                      <p className="text-gray-500 mt-2">Loading cron jobs...</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          Auto-refreshes every 60 seconds
        </p>
      </div>

      {/* Create Modal */}
      <CreateCronJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleConfirmCreate}
        agents={agents}
        isLoading={createMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={!!jobToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        jobName={jobToDelete?.name || ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
