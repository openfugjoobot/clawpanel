/**
 * AuthContext - Authentication state management
 * 
 * SECURITY WARNING:
 * - localStorage is vulnerable to XSS attacks
 * - Credentials are stored in plaintext in localStorage
 * - For production: use HTTP-only cookies with secure token refresh
 * - This implementation is for demo/development purposes only
 */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthState {
  user: string | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuth: () => boolean;
  getCredentials: () => { username: string; password: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'clawpanel_auth';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
  });

  // Load auth from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuth({
          user: parsed.user || null,
          token: parsed.token || null,
        });
      } catch {
        // Invalid stored data - clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  /**
   * Login - store credentials in state and localStorage
   * @returns true on success, false on failure
   */
  const login = (username: string, password: string): boolean => {
    // Validate input
    if (!username || !password) {
      return false;
    }
    
    // Basic sanitization
    if (typeof username !== 'string' || typeof password !== 'string') {
      return false;
    }
    
    // Check for reasonable length
    if (username.length > 100 || password.length > 100) {
      return false;
    }

    // Create Basic Auth token
    const credentials = `${username}:${password}`;
    const token = 'Basic ' + btoa(credentials);

    // Save to state and localStorage
    const authData: AuthState = {
      user: username,
      token,
    };

    setAuth(authData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    return true;
  };

  /**
   * Logout - clear credentials from state and localStorage
   */
  const logout = (): void => {
    setAuth({
      user: null,
      token: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Check if user is authenticated
   */
  const isAuth = (): boolean => {
    return !!auth.token;
  };
  
  /**
   * Get credentials for WebSocket connection
   * Returns null if not authenticated
   * SECURITY: Only use this for WebSocket header auth, never for URLs!
   */
  const getCredentials = (): { username: string; password: string } | null => {
    if (!auth.token) return null;
    
    try {
      // Decode Basic Auth token
      const base64 = auth.token.replace('Basic ', '');
      const decoded = atob(base64);
      const [username, ...passwordParts] = decoded.split(':');
      const password = passwordParts.join(':');
      
      if (!username || !password) return null;
      
      return { username, password };
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuth, getCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
