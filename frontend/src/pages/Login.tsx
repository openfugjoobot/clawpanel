/**
 * Login Page
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, User, Terminal, Loader2, KeyRound, X, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const LAST_PATH_KEY = 'clawpanel_last_path';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuth } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  // Get saved path from localStorage (set by ProtectedRoute before redirect)
  const getSavedPath = (): string | null => {
    try {
      return localStorage.getItem(LAST_PATH_KEY);
    } catch {
      return null;
    }
  };

  // Redirect if already authenticated (to saved path or dashboard)
  useEffect(() => {
    if (isAuth()) {
      const savedPath = getSavedPath();
      // Clean up saved path
      localStorage.removeItem(LAST_PATH_KEY);
      // Navigate to saved path or default to dashboard
      navigate(savedPath || '/dashboard');
    }
  }, [isAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Test login by calling /api/gateway/status with Basic Auth
      const credentials = `${username}:${password}`;
      const basicAuth = 'Basic ' + btoa(credentials);
      
      const response = await axios.get(`${API_BASE_URL}/gateway/status`, {
        headers: {
          'Authorization': basicAuth,
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        // Login successful - save credentials (useEffect will handle navigation)
        login(username, password);
        // DON'T navigate here - useEffect will do it after auth state update
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Login failed: Invalid credentials');
        } else if (err.response?.status === 403) {
          setError('Login failed: Access forbidden');
        } else if (!err.response) {
          setError('Login failed: Cannot connect to server');
        } else {
          setError('Login failed: Server error');
        }
      } else {
        setError('Login failed: Unexpected error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setTempPassword('');
    setForgotLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        username: forgotUsername
      });
      
      if (response.data.tempPassword) {
        setTempPassword(response.data.tempPassword);
        setForgotSuccess('A temporary password has been generated.');
      } else {
        setForgotSuccess('If the account exists, a password reset has been initiated.');
      }
    } catch (err) {
      setForgotError('Failed to process request. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };
  
  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError('');
    setForgotSuccess('');
    setTempPassword('');
    setForgotUsername('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
                        <Terminal className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ClawPanel</h1>
          <p className="text-gray-500 mt-2">Sign in to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Enter your username"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               transition-colors text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-base font-semibold flex items-center justify-center gap-2
                           bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Contact your administrator for access</p>
          </div>

          {/* Version */}
          <p className="text-center text-xs text-gray-400 mt-6">
            ClawPanel v1.0.0
          </p>
        </div>
        
        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">Reset Password</h2>
                </div>
                <button
                  onClick={closeForgotModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                {forgotError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{forgotError}</p>
                  </div>
                )}
                
                {forgotSuccess && tempPassword && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700">{forgotSuccess}</p>
                    </div>                    
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Your temporary password:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={tempPassword}
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(tempPassword)}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ This password expires in 24 hours. Please change it immediately after login.
                      </p>
                    </div>
                  </div>
                )}
                
                {!tempPassword && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter your username to generate a temporary password.
                    </p>
                    
                    <div>
                      <label 
                        htmlFor="forgot-username" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="forgot-username"
                          type="text"
                          value={forgotUsername}
                          onChange={(e) => setForgotUsername(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     transition-colors text-gray-900"
                          placeholder="Enter your username"
                          required
                          disabled={forgotLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={closeForgotModal}
                        className="flex-1"
                        disabled={forgotLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={forgotLoading || !forgotUsername}
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
                
                {tempPassword && (
                  <Button
                    onClick={closeForgotModal}
                    variant="primary"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
