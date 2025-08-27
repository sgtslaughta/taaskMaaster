/**
 * @fileoverview Comment Service for TaaskMaaster
 * @description Service for handling comment operations with the backend API
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

/**
 * @description Comment interface
 */
export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  content_type: string;
  parent_comment_id?: number;
  is_system_comment: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  media_attachments?: MediaAttachment[];
  replies?: Comment[];
}

/**
 * @description Media attachment interface
 */
export interface MediaAttachment {
  id: number;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

/**
 * @description Comment creation request
 */
export interface CommentCreateRequest {
  task_id: number;
  content: string;
  content_type?: string;
  parent_comment_id?: number;
  media_attachment_ids?: number[];
}

/**
 * @description Comment update request
 */
export interface CommentUpdateRequest {
  content: string;
  content_type?: string;
}

/**
 * @description Comment list response
 */
export interface CommentListResponse {
  comments: Comment[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * @description Task status history entry
 */
export interface TaskStatusHistory {
  id: number;
  task_id: number;
  user_id: number;
  previous_status?: string;
  new_status: string;
  comment?: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * @description Task status history list response
 */
export interface TaskStatusHistoryListResponse {
  history: TaskStatusHistory[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * @description Comment Service Class
 * @class CommentService
 */
export class CommentService {
  /**
   * Create a new comment
   * @param commentData - Comment creation data
   * @returns Promise<Comment>
   */
  static async createComment(commentData: CommentCreateRequest): Promise<Comment> {
    try {
      const response = await apiPost('/api/v1/comments/', commentData);
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a task
   * @param taskId - Task ID
   * @param skip - Number of comments to skip
   * @param limit - Maximum number of comments to return
   * @param includeSystem - Whether to include system comments
   * @returns Promise<CommentListResponse>
   */
  static async getTaskComments(
    taskId: number,
    skip: number = 0,
    limit: number = 100,
    includeSystem: boolean = true
  ): Promise<CommentListResponse> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        include_system: includeSystem.toString(),
      });
      
      const response = await apiGet(`/api/v1/comments/task/${taskId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task comments:', error);
      throw error;
    }
  }

  /**
   * Get a specific comment by ID
   * @param commentId - Comment ID
   * @returns Promise<Comment>
   */
  static async getComment(commentId: number): Promise<Comment> {
    try {
      const response = await apiGet(`/api/v1/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   * @param commentId - Comment ID
   * @param updateData - Comment update data
   * @returns Promise<Comment>
   */
  static async updateComment(
    commentId: number,
    updateData: CommentUpdateRequest
  ): Promise<Comment> {
    try {
      const response = await apiPut(`/api/v1/comments/${commentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param commentId - Comment ID
   * @returns Promise<void>
   */
  static async deleteComment(commentId: number): Promise<void> {
    try {
      await apiDelete(`/api/v1/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Add media attachment to a comment
   * @param commentId - Comment ID
   * @param mediaId - Media attachment ID
   * @returns Promise<void>
   */
  static async addCommentMedia(commentId: number, mediaId: number): Promise<void> {
    try {
      await apiPost(`/api/v1/comments/${commentId}/media/${mediaId}`, {});
    } catch (error) {
      console.error('Error adding comment media:', error);
      throw error;
    }
  }

  /**
   * Remove media attachment from a comment
   * @param commentId - Comment ID
   * @param mediaId - Media attachment ID
   * @returns Promise<void>
   */
  static async removeCommentMedia(commentId: number, mediaId: number): Promise<void> {
    try {
      await apiDelete(`/api/v1/comments/${commentId}/media/${mediaId}`);
    } catch (error) {
      console.error('Error removing comment media:', error);
      throw error;
    }
  }
}
