/**
 * Comment Service
 * 
 * Handles all comment-related API calls including CRUD operations,
 * threading, reactions, and search functionality.
 */

import { apiClient } from './apiClient';
import { TaskComment, CommentThread, CommentSearchResult } from '../types/comment';
import { User } from '../types/user';

export interface CreateCommentRequest {
  task_id: number;
  content: string;
  parent_comment_id?: number;
  media_attachments?: number[];
  mentioned_user_ids?: number[];
}

export interface UpdateCommentRequest {
  content: string;
  media_attachments?: number[];
}

export interface CommentFilters {
  user_id?: number;
  date_from?: string;
  date_to?: string;
  has_media?: boolean;
  is_system_generated?: boolean;
  parent_comment_id?: number;
  mentioned_user_id?: number;
}

export interface CommentQueryParams extends CommentFilters {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include_replies?: boolean;
  include_media?: boolean;
  include_reactions?: boolean;
  include_mentions?: boolean;
}

export interface CommentsResponse {
  comments: TaskComment[];
  total_count: number;
  has_more: boolean;
}

export interface CommentResponse {
  comment: TaskComment;
  success: boolean;
  message?: string;
}

export interface CommentThreadResponse {
  thread: CommentThread;
  success: boolean;
}

class CommentService {
  /**
   * Get comments for a specific task
   */
  async getTaskComments(taskId: number, params?: CommentQueryParams): Promise<CommentsResponse> {
    const response = await apiClient.get(`/api/v1/comments/task/${taskId}`, { params });
    return response.data;
  }

  /**
   * Get a specific comment by ID
   */
  async getComment(commentId: number, params?: {
    include_replies?: boolean;
    include_media?: boolean;
    include_reactions?: boolean;
  }): Promise<CommentResponse> {
    const response = await apiClient.get(`/api/v1/comments/${commentId}`, { params });
    return response.data;
  }

  /**
   * Create a new task comment
   */
  async createTaskComment(request: CreateCommentRequest): Promise<CommentResponse> {
    const response = await apiClient.post('/api/v1/comments', request);
    return response.data;
  }

  /**
   * Update an existing comment
   */
  async updateTaskComment(commentId: number, request: UpdateCommentRequest): Promise<CommentResponse> {
    const response = await apiClient.put(`/api/v1/comments/${commentId}`, request);
    return response.data;
  }

  /**
   * Delete a comment
   */
  async deleteTaskComment(commentId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/api/v1/comments/${commentId}`);
    return response.data;
  }

  /**
   * Get comment thread (parent comment with all replies)
   */
  async getCommentThread(commentId: number, params?: {
    limit?: number;
    offset?: number;
    sort_order?: 'asc' | 'desc';
  }): Promise<CommentThreadResponse> {
    const response = await apiClient.get(`/api/v1/comments/${commentId}/thread`, { params });
    return response.data;
  }

  /**
   * Pin a comment
   */
  async pinComment(commentId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/v1/comments/${commentId}/pin`);
    return response.data;
  }

  /**
   * Unpin a comment
   */
  async unpinComment(commentId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/api/v1/comments/${commentId}/pin`);
    return response.data;
  }

  /**
   * Add reaction to comment
   */
  async addReaction(commentId: number, reaction: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/v1/comments/${commentId}/reactions`, {
      reaction
    });
    return response.data;
  }

  /**
   * Remove reaction from comment
   */
  async removeReaction(commentId: number, reaction: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/api/v1/comments/${commentId}/reactions/${reaction}`);
    return response.data;
  }

  /**
   * Get comment reactions
   */
  async getCommentReactions(commentId: number): Promise<{
    reactions: Array<{
      reaction: string;
      count: number;
      users: User[];
      user_reacted: boolean;
    }>;
  }> {
    const response = await apiClient.get(`/api/v1/comments/${commentId}/reactions`);
    return response.data;
  }

  /**
   * Search comments
   */
  async searchComments(params: {
    query: string;
    task_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    has_media?: boolean;
    mentioned_user_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    results: CommentSearchResult[];
    total_count: number;
    search_time_ms: number;
  }> {
    const response = await apiClient.get('/api/v1/comments/search', { params });
    return response.data;
  }

  /**
   * Get comments by user
   */
  async getUserComments(userId: number, params?: {
    limit?: number;
    offset?: number;
    task_id?: number;
    date_from?: string;
    date_to?: string;
    include_replies?: boolean;
  }): Promise<CommentsResponse> {
    const response = await apiClient.get(`/api/v1/comments/user/${userId}`, { params });
    return response.data;
  }

  /**
   * Get comment mentions for user
   */
  async getCommentMentions(params?: {
    limit?: number;
    offset?: number;
    is_read?: boolean;
    task_id?: number;
  }): Promise<{
    mentions: Array<{
      id: number;
      comment: TaskComment;
      mentioned_by_user: User;
      is_read: boolean;
      created_at: string;
    }>;
    total_count: number;
    unread_count: number;
  }> {
    const response = await apiClient.get('/api/v1/comments/mentions', { params });
    return response.data;
  }

  /**
   * Mark comment mention as read
   */
  async markMentionAsRead(mentionId: number): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/api/v1/comments/mentions/${mentionId}/read`);
    return response.data;
  }

  /**
   * Get comment statistics
   */
  async getCommentStats(params?: {
    task_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_comments: number;
    comments_by_user: Array<{
      user: User;
      comment_count: number;
    }>;
    comments_by_task: Array<{
      task_id: number;
      task_title: string;
      comment_count: number;
    }>;
    daily_activity: Array<{
      date: string;
      comment_count: number;
    }>;
    reaction_summary: Array<{
      reaction: string;
      count: number;
    }>;
  }> {
    const response = await apiClient.get('/api/v1/comments/stats', { params });
    return response.data;
  }

  /**
   * Bulk operations
   */
  async bulkDeleteComments(commentIds: number[]): Promise<{
    success: boolean;
    deleted_count: number;
    failed_count: number;
    errors: string[];
  }> {
    const response = await apiClient.post('/api/v1/comments/bulk-delete', {
      comment_ids: commentIds
    });
    return response.data;
  }

  async bulkUpdateComments(updates: Array<{
    comment_id: number;
    content?: string;
    is_pinned?: boolean;
  }>): Promise<{
    success: boolean;
    updated_count: number;
    failed_count: number;
    errors: string[];
  }> {
    const response = await apiClient.post('/api/v1/comments/bulk-update', {
      updates
    });
    return response.data;
  }

  async bulkCreateComments(comments: CreateCommentRequest[]): Promise<{
    success: boolean;
    created_count: number;
    failed_count: number;
    created_comments: TaskComment[];
    errors: string[];
  }> {
    const response = await apiClient.post('/api/v1/comments/bulk-create', {
      comments
    });
    return response.data;
  }

  /**
   * Export comments
   */
  async exportComments(params: {
    task_id?: number;
    format: 'json' | 'csv' | 'pdf';
    date_from?: string;
    date_to?: string;
    include_replies?: boolean;
    include_media?: boolean;
  }): Promise<{ download_url: string; expires_at: string }> {
    const response = await apiClient.post('/api/v1/comments/export', params);
    return response.data;
  }

  /**
   * Comment drafts
   */
  async saveCommentDraft(draft: {
    task_id: number;
    content: string;
    parent_comment_id?: number;
    media_attachments?: number[];
  }): Promise<{ success: boolean; draft_id: number }> {
    const response = await apiClient.post('/api/v1/comments/drafts', draft);
    return response.data;
  }

  async getCommentDrafts(taskId?: number): Promise<{
    drafts: Array<{
      id: number;
      task_id: number;
      content: string;
      parent_comment_id?: number;
      created_at: string;
      updated_at: string;
    }>;
  }> {
    const params = taskId ? { task_id: taskId } : {};
    const response = await apiClient.get('/api/v1/comments/drafts', { params });
    return response.data;
  }

  async deleteCommentDraft(draftId: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/api/v1/comments/drafts/${draftId}`);
    return response.data;
  }

  /**
   * Comment templates
   */
  async getCommentTemplates(): Promise<{
    templates: Array<{
      id: number;
      name: string;
      content: string;
      category: string;
      is_public: boolean;
    }>;
  }> {
    const response = await apiClient.get('/api/v1/comments/templates');
    return response.data;
  }

  async createCommentTemplate(template: {
    name: string;
    content: string;
    category: string;
    is_public?: boolean;
  }): Promise<{ success: boolean; template_id: number }> {
    const response = await apiClient.post('/api/v1/comments/templates', template);
    return response.data;
  }

  /**
   * Advanced search functionality
   */
  async searchTaskComments(params: {
    query?: string;
    task_id?: number;
    user_ids?: number[];
    content_types?: string[];
    has_attachments?: boolean;
    has_reactions?: boolean;
    is_edited?: boolean;
    tags?: string[];
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
    include_mentions?: boolean;
    include_reactions?: boolean;
  }): Promise<{
    comments: TaskComment[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
  }> {
    const response = await apiClient.get('/api/v1/comments/search', { params });
    return response.data;
  }

  async getCommentsByTag(tag: string, params?: {
    page?: number;
    per_page?: number;
    task_id?: number;
  }): Promise<{
    comments: TaskComment[];
    total: number;
    has_more: boolean;
  }> {
    const response = await apiClient.get(`/api/v1/comments/tags/${encodeURIComponent(tag)}`, { params });
    return response.data;
  }

  async getPopularTags(params?: {
    task_id?: number;
    limit?: number;
  }): Promise<{
    tags: Array<{
      tag: string;
      count: number;
    }>;
  }> {
    const response = await apiClient.get('/api/v1/comments/tags/popular', { params });
    return response.data;
  }
}

export const commentService = new CommentService();