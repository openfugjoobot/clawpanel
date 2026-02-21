import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FileText, ArrowLeft, HardDrive, RefreshCw, Loader2, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getFiles, type FileItem } from '../services/workspace';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFiles(path);
      // Sort: directories first, then files
      const sorted = data.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      setFiles(sorted);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles('');
  }, []);

  const handleFolderClick = (name: string) => {
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    loadFiles(newPath);
  };

  const handleGoBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    loadFiles(parentPath);
  };

  const handleFileClick = (file: FileItem) => {
    alert(`File: ${file.name}\nSize: ${formatBytes(file.size || 0)}\nModified: ${file.modifiedAt}\n\nPath: /files/${encodeURIComponent(file.path)}`);
  };

  const breadcrumbs = currentPath ? ['workspace', ...currentPath.split('/')] : ['workspace'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workspace</h1>
            <p className="text-sm text-gray-600 mt-1">Browse files and directories</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => loadFiles(currentPath)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <HardDrive className="w-4 h-4" />
          <span className="text-gray-400">/</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900">{crumb}</span>
              ) : (
                <span className="text-blue-600">{crumb}</span>
              )}
              {idx < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* File List Card */}
        <Card className="overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-4 flex items-center gap-2 bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              disabled={!currentPath || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Parent
            </Button>
            <span className="text-sm text-gray-500 ml-4">
              {loading ? 'Loading...' : `${files.length} items`}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* File List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>This directory is empty</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => file.type === 'directory' ? handleFolderClick(file.name) : handleFileClick(file)}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {file.type === 'directory' ? (
                    <Folder className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.type === 'directory' ? 'Directory' : formatBytes(file.size || 0)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{formatDistanceToNow(new Date(file.modifiedAt), { addSuffix: true })}</p>
                    {file.type === 'file' && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 justify-end">
                        <Download className="w-3 h-3" />
                        Click to view
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
