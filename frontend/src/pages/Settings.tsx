import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Download, AlertCircle, CheckCircle, Settings as SettingsIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { getConfig, updateConfig } from '../services/config';

type Status = 'idle' | 'loading' | 'saved' | 'unsaved' | 'error';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [configText, setConfigText] = useState<string>('');
  const [originalConfig, setOriginalConfig] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  const loadConfig = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    setSaveError('');
    try {
      const data = await getConfig();
      const jsonString = JSON.stringify(data, null, 2);
      setConfigText(jsonString);
      setOriginalConfig(jsonString);
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load config');
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const validateJson = (json: string): { valid: boolean; error?: string; parsed?: unknown } => {
    try {
      const parsed = JSON.parse(json);
      return { valid: true, parsed };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setConfigText(newText);
    setSaveError('');
    
    // Check if different from original
    const normalizedNew = newText.trim();
    const normalizedOrig = originalConfig.trim();
    if (normalizedNew !== normalizedOrig) {
      setStatus('unsaved');
    } else {
      setStatus('saved');
    }
  };

  const handleSave = async () => {
    const validation = validateJson(configText);
    
    if (!validation.valid) {
      setStatus('error');
      setSaveError(`Invalid JSON: ${validation.error}`);
      return;
    }

    // Confirm before saving
    if (!window.confirm('Save configuration? A backup will be created automatically.')) {
      return;
    }

    setStatus('loading');
    setSaveError('');
    
    try {
      await updateConfig(validation.parsed);
      setOriginalConfig(configText);
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save config');
    }
  };

  const handleReset = () => {
    if (configText !== originalConfig) {
      if (!window.confirm('Reset to last saved configuration? Unsaved changes will be lost.')) {
        return;
      }
    }
    setConfigText(originalConfig);
    setStatus('saved');
    setSaveError('');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saved': return 'bg-green-50 border-green-200 text-green-800';
      case 'unsaved': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'loading': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unsaved': return <SettingsIcon className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'loading': return <SettingsIcon className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saved': return 'Saved';
      case 'unsaved': return 'Unsaved changes';
      case 'error': return 'Error';
      case 'loading': return 'Loading...';
      default: return 'Ready';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Edit openclaw.json configuration</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {(errorMsg || saveError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-600 mt-1">{errorMsg || saveError}</p>
            </div>
          </div>
        )}

        {/* Backup Notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> The backend automatically creates a backup when saving.
          </p>
        </div>

        {/* Config Editor */}
        <Card>
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <Button 
                variant="outline" 
                onClick={loadConfig}
                disabled={status === 'loading'}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Reload
              </Button>
              
              <div className="flex-1" />
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={status === 'loading' || configText === originalConfig}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={status === 'loading' || status === 'saved'}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>

            {/* Textarea */}
            <textarea
              value={configText}
              onChange={handleTextChange}
              disabled={status === 'loading'}
              className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Loading configuration..."
              spellCheck={false}
            />

            {/* Footer Info */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
              <span>
                Lines: {configText.split('\n').length} | Characters: {configText.length}
              </span>
              <span className="text-gray-400">
                Use JSON format
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
