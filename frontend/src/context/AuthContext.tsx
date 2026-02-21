/**
 * AuthContext - Authentication state management
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
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  /**
   * Login - store credentials in state and localStorage
   * @returns true on success, false on failure
   */
  const login = (username: string, password: string): boolean => {
    if (!username || !password) {
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

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuth }}>
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
