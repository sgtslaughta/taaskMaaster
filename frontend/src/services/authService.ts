/**
 * @fileoverview Authentication Service for TaaskMaaster
 * @description Service for handling authentication with the backend API
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { apiGet, apiPost } from './api';

/**
 * @description Login request interface
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * @description Login response interface
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}

/**
 * @description Refresh token request interface
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * @description Refresh token response interface
 */
export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * @description Logout response interface
 */
export interface LogoutResponse {
  message: string;
}

/**
 * @description Current user information interface
 */
export interface CurrentUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * @description Authentication service class
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: CurrentUser | null = null;

  /**
   * @description Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * @description Login user with credentials
   * @param credentials - Login credentials
   * @returns Promise with login response
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiPost<LoginResponse>('/api/v1/auth/login', credentials);
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      // Store user info
      this.currentUser = {
        user_id: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name,
        is_active: response.data.is_active,
        is_superuser: response.data.is_superuser,
      };

      return response.data;
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  /**
   * @description Logout current user
   * @returns Promise with logout response
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await apiPost<LogoutResponse>('/api/v1/auth/logout');
      
      // Clear tokens and user data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.currentUser = null;

      return response.data;
    } catch (error) {
      // Even if logout fails, clear local data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.currentUser = null;
      
      return { message: 'Logged out successfully' };
    }
  }

  /**
   * @description Refresh access token
   * @param refreshToken - Refresh token
   * @returns Promise with new access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiPost<RefreshTokenResponse>('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      // Update stored access token
      localStorage.setItem('access_token', response.data.access_token);
      
      return response.data;
    } catch (error) {
      // Clear tokens if refresh fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.currentUser = null;
      
      throw new Error('Token refresh failed. Please login again.');
    }
  }

  /**
   * @description Get current user information
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<CurrentUser> {
    try {
      const response = await apiGet<CurrentUser>('/api/v1/auth/me');
      this.currentUser = response.data;
      return response.data;
    } catch (error) {
      throw new Error('Failed to get current user information.');
    }
  }

  /**
   * @description Check if user is authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token && !!this.currentUser;
  }

  /**
   * @description Get current user from cache
   * @returns Current user or null
   */
  getCurrentUserFromCache(): CurrentUser | null {
    return this.currentUser;
  }

  /**
   * @description Get stored access token
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * @description Get stored refresh token
   * @returns Refresh token or null
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * @description Check if token is expired
   * @returns Boolean indicating if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * @description Initialize authentication state
   * @returns Promise with current user if authenticated
   */
  async initializeAuth(): Promise<CurrentUser | null> {
    if (this.isAuthenticated() && !this.isTokenExpired()) {
      try {
        return await this.getCurrentUser();
      } catch (error) {
        // If getting user info fails, clear auth state
        this.logout();
        return null;
      }
    }
    return null;
  }

  /**
   * @description Clear authentication state
   */
  clearAuth(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUser = null;
  }
}

/**
 * @description Export singleton instance
 */
export const authService = AuthService.getInstance();
