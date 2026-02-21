import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Github,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  GitPullRequest,
  CircleDot,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getIssues, getPRs } from '../services/github';
import type { GitHubIssue, GitHubPullRequest } from '../types';

// Predefined repositories (can be replaced with dynamic fetching later)
const REPOSITORIES = [
  { owner: 'openclaw', repo: 'clawpanel', label: 'clawpanel' },
];

type TabType = 'issues' | 'pulls';
type StateFilter = 'open' | 'closed' | 'all';

interface GitHubData {
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
  loading: boolean;
  error: string | null;
}

// Helper to get issue color
const getIssueBadgeVariant = (state: string): 'default' | 'success' | 'warning' | 'error' => {
  switch (state) {
    case 'open':
      return 'success';
    case 'closed':
      return 'error';
    default:
      return 'default';
  }
};

// Helper to get PR status
const getPRStatus = (pr: GitHubPullRequest): { label: string; variant: 'default' | 'success' | 'warning' | 'error' } => {
  if (pr.merged) {
    return { label: 'merged', variant: 'error' };
  }
  if (pr.draft) {
    return { label: 'draft', variant: 'warning' };
  }
  if (pr.state === 'open') {
    return { label: 'open', variant: 'success' };
  }
  return { label: 'closed', variant: 'error' };
};

export const GitHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('issues');
  const [stateFilter, setStateFilter] = useState<StateFilter>('open');
  const [selectedRepo, setSelectedRepo] = useState(0);
  const [data, setData] = useState<GitHubData>({
    issues: [],
    pulls: [],
    loading: true,
    error: null,
  });

  const { owner, repo } = REPOSITORIES[selectedRepo];

  const fetchData = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [issuesData, pullsData] = await Promise.all([
        getIssues(owner, repo, stateFilter).catch(() => []),
        getPRs(owner, repo, stateFilter).catch(() => []),
      ]);

      setData((prev) => ({
        ...prev,
        issues: issuesData,
        pulls: pullsData,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch GitHub data',
      }));
    }
  }, [owner, repo, stateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGoBack = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const openGitHub = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const filteredPulls = data.pulls;
  const filteredIssues = data.issues;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
              <div className="flex items-center gap-2">
                <Github className="w-6 h-6 text-gray-700" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  GitHub Repository
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {owner}/{repo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REPOSITORIES.map((r, i) => (
                <option key={i} value={i}>
                  {r.owner}/{r.repo}
                </option>
              ))}
            </select>
            {data.loading && (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            )}
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={data.loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${data.loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('issues')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${
                    activeTab === 'issues'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <CircleDot className="w-4 h-4" />
                Issues
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'issues'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {data.issues.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('pulls')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${
                    activeTab === 'pulls'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <GitPullRequest className="w-4 h-4" />
                Pull Requests
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'pulls'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {data.pulls.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* State Filter */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">State:</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as StateFilter)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Error Alert */}
        {data.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-600 mt-1">{data.error}</p>
              <button
                onClick={fetchData}
                className="text-sm text-red-700 underline mt-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <Card>
          {activeTab === 'issues' ? (
            <>
              {filteredIssues.length === 0 && !data.loading ? (
                <div className="py-16 text-center">
                  <CircleDot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No issues found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stateFilter === 'open'
                      ? 'There are no open issues'
                      : stateFilter === 'closed'
                      ? 'There are no closed issues'
                      : 'No issues in this repository'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <Badge variant={getIssueBadgeVariant(issue.state)}>
                            {issue.state}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() => openGitHub(issue.html_url)}
                          >
                            {issue.title}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>
                              #{issue.number} opened{' '}
                              {formatDistanceToNow(new Date(issue.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            <span>by {issue.user.login}</span>
                            {issue.comments > 0 && (
                              <span>• {issue.comments} comments</span>
                            )}
                          </div>
                          {issue.labels.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {issue.labels.map((label) => (
                                <span
                                  key={label.name}
                                  className="px-2 py-0.5 text-xs rounded-md"
                                  style={{
                                    backgroundColor: `#${label.color}20`,
                                    color: `#${label.color}`,
                                    border: `1px solid #${label.color}40`,
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGitHub(issue.html_url)}
                          className="flex-shrink-0 p-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredPulls.length === 0 && !data.loading ? (
                <div className="py-16 text-center">
                  <GitPullRequest className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No pull requests found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stateFilter === 'open'
                      ? 'There are no open pull requests'
                      : stateFilter === 'closed'
                      ? 'There are no closed pull requests'
                      : 'No pull requests in this repository'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPulls.map((pr) => {
                    const status = getPRStatus(pr);
                    return (
                      <div
                        key={pr.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                              onClick={() => openGitHub(pr.html_url)}
                            >
                              {pr.title}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span>
                                #{pr.number} opened{' '}
                                {formatDistanceToNow(new Date(pr.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                              <span>by {pr.user.login}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              <span>
                                {pr.head.ref} → {pr.base.ref}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGitHub(pr.html_url)}
                            className="flex-shrink-0 p-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {data.loading && (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />
              <p className="text-gray-500 mt-2">Loading {activeTab}...</p>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          Click the external link icon to open on GitHub
        </p>
      </div>
    </div>
  );
};
