/**
 * @fileoverview Authentication Context for TaaskMaaster
 * @description React context for managing authentication state
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, CurrentUser, LoginRequest } from '../services/authService';

/**
 * @description Authentication context interface
 */
interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * @description Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @description Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * @description Authentication provider component
 * @param props - Provider props
 * @returns Authentication provider
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Initialize authentication state
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.initializeAuth();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * @description Login function
   * @param credentials - Login credentials
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      const currentUser = await authService.getCurrentUser();
      
      setUser(currentUser);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @description Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @description Clear error function
   */
  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @description Hook to use authentication context
 * @returns Authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * @description Hook to check if user is authenticated
 * @returns Boolean indicating authentication status
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * @description Hook to get current user
 * @returns Current user or null
 */
export const useCurrentUser = (): CurrentUser | null => {
  const { user } = useAuth();
  return user;
};
