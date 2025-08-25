/**
 * User service for handling user-related API operations
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface UserList {
  users: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  /**
   * Get all users with optional filtering and pagination
   */
  async getUsers(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    is_active?: boolean
  ): Promise<UserList> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append('search', search);
    }
    if (is_active !== undefined) {
      params.append('is_active', is_active.toString());
    }

    const response = await apiGet<UserList>(`/api/v1/users/?${params}`);
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: number): Promise<User> {
    const response = await apiGet<User>(`/api/v1/users/${userId}`);
    return response.data;
  }

  /**
   * Create a new user
   */
  async createUser(userData: UserCreateRequest): Promise<User> {
    const response = await apiPost<User>('/api/v1/users/', userData);
    return response.data;
  }

  /**
   * Update an existing user
   */
  async updateUser(userId: number, userData: UserUpdateRequest): Promise<User> {
    const response = await apiPut<User>(`/api/v1/users/${userId}`, userData);
    return response.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<void> {
    await apiDelete(`/api/v1/users/${userId}`);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiGet<any>('/api/v1/auth/me');
    return {
      id: response.data.user_id,
      username: response.data.username,
      email: response.data.email,
      first_name: response.data.full_name?.split(' ')[0] || undefined,
      last_name: response.data.full_name?.split(' ').slice(1).join(' ') || undefined,
      is_active: response.data.is_active,
      created_at: response.data.created_at || new Date().toISOString(),
      updated_at: response.data.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Get users for task assignment (simplified list)
   */
  async getUsersForAssignment(): Promise<User[]> {
    try {
      const response = await apiGet<UserList>('/api/v1/users/for-assignment');
      return response.data.users;
    } catch (error) {
      console.error('Failed to fetch users for assignment:', error);
      // Let the error propagate to the frontend for proper error handling
      throw error;
    }
  }
}

export const userService = new UserService();
