/**
 * @fileoverview Authentication Context for TaaskMaaster
 * @description React context for managing authentication state
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { 
  saveLoginState, 
  getLoginState, 
  clearLoginState,
  saveUserSettings 
} from '../utils/cookies';

/**
 * @description User interface
 */
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
  points?: number;
  level?: number;
}

/**
 * @description Auth context interface
 */
interface AuthContextType {
  /** Current user */
  user: User | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth is loading */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Login function */
  login: (credentials: { username: string; password: string }) => Promise<void>;
  /** Logout function */
  logout: () => Promise<void>;
  /** Clear error function */
  clearError: () => void;
}

/**
 * @description Auth context default values
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @description Auth provider component
 * Manages authentication state and provides auth functions
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Initialize auth state from cookies
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for saved login state in cookies
        const savedLoginState = getLoginState();
        
        if (savedLoginState && savedLoginState.token) {
          // Set the token in auth service
          authService.setAccessToken(savedLoginState.token);
          
          // Try to get current user
          try {
            const currentUser = await authService.getCurrentUser();
            setUser({
              id: currentUser.user_id.toString(),
              username: currentUser.username,
              email: currentUser.email,
              role: currentUser.is_superuser ? 'admin' : 'user',
            });
            
            // Update last login time
            saveLoginState({
              ...savedLoginState,
              lastLogin: Date.now(),
            });
            
            console.log('User authenticated from saved session');
          } catch (error) {
            console.error('Failed to get current user from saved session:', error);
            // Clear invalid login state
            clearLoginState();
            authService.clearAuth();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * @description Login function
   */
  const login = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      // Convert API response to User interface
      const userData: User = {
        id: response.user_id.toString(),
        username: response.username,
        email: response.email,
        role: response.is_superuser ? 'admin' : 'user',
      };
      
      // Save login state to cookies
      saveLoginState({
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        token: response.access_token,
        lastLogin: Date.now(),
      });

      // Update user settings with last login
      saveUserSettings({
        lastLogin: Date.now(),
      });

      setUser(userData);
      console.log('User logged in successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @description Logout function
   */
  const logout = async () => {
    try {
      // Call logout API
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state
      setUser(null);
      setError(null);
      
      // Clear cookies
      clearLoginState();
      
      // Clear auth service token
      authService.clearAuth();
      
      console.log('User logged out successfully');
    }
  };

  /**
   * @description Clear error function
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @description Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
