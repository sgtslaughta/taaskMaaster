/**
 * @fileoverview Messaging Service for TaaskMaaster
 * @description Service for handling messaging operations with the backend API
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { apiGet, apiPost } from './api';

/**
 * @description User interface
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
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
 * @description Direct message interface
 */
export interface DirectMessage {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content: string;
  content_type: string;
  thread_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  from_user?: User;
  to_user?: User;
  media_attachments?: MediaAttachment[];
}

/**
 * @description Task chat message interface
 */
export interface TaskChatMessage {
  id: number;
  task_id: number;
  from_user_id: number;
  content: string;
  content_type: string;
  parent_message_id?: number;
  created_at: string;
  updated_at: string;
  from_user?: User;
  media_attachments?: MediaAttachment[];
}

/**
 * @description Conversation interface
 */
export interface Conversation {
  other_user?: User;
  latest_message: DirectMessage;
  unread_count: number;
}

/**
 * @description User status interface
 */
export interface UserStatus {
  id: number;
  user_id: number;
  status: string;
  custom_message?: string;
  last_seen: string;
  updated_at: string;
  user?: User;
}

/**
 * @description Direct message creation request
 */
export interface DirectMessageCreateRequest {
  to_user_id: number;
  content: string;
  content_type?: string;
  thread_id?: string;
  media_attachment_ids?: number[];
}

/**
 * @description Task chat message creation request
 */
export interface TaskChatMessageCreateRequest {
  task_id: number;
  content: string;
  content_type?: string;
  parent_message_id?: number;
  media_attachment_ids?: number[];
}

/**
 * @description User status update request
 */
export interface UserStatusUpdateRequest {
  status: string;
  custom_message?: string;
}

/**
 * @description Typing indicator request
 */
export interface TypingIndicatorRequest {
  context_type: string;
  context_id: number;
  is_typing: boolean;
}

/**
 * @description Message list response
 */
export interface MessageListResponse<T> {
  messages: T[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * @description Conversation list response
 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

/**
 * @description Online users response
 */
export interface OnlineUsersResponse {
  online_users: UserStatus[];
  total: number;
}

/**
 * @description Messaging Service Class
 * @class MessagingService
 */
export class MessagingService {
  /**
   * Send a direct message
   * @param messageData - Direct message creation data
   * @returns Promise<DirectMessage>
   */
  static async sendDirectMessage(
    messageData: DirectMessageCreateRequest
  ): Promise<DirectMessage> {
    try {
      const response = await apiPost('/api/v1/messages/direct', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  }

  /**
   * Get direct messages with another user
   * @param otherUserId - Other user ID
   * @param skip - Number of messages to skip
   * @param limit - Maximum number of messages to return
   * @returns Promise<MessageListResponse<DirectMessage>>
   */
  static async getDirectMessages(
    otherUserId: number,
    skip: number = 0,
    limit: number = 50
  ): Promise<MessageListResponse<DirectMessage>> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiGet(`/api/v1/messages/direct/${otherUserId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      throw error;
    }
  }

  /**
   * Get user conversations
   * @param skip - Number of conversations to skip
   * @param limit - Maximum number of conversations to return
   * @returns Promise<ConversationListResponse>
   */
  static async getConversations(
    skip: number = 0,
    limit: number = 20
  ): Promise<ConversationListResponse> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiGet(`/api/v1/messages/conversations?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Send a task chat message
   * @param messageData - Task chat message creation data
   * @returns Promise<TaskChatMessage>
   */
  static async sendTaskChatMessage(
    messageData: TaskChatMessageCreateRequest
  ): Promise<TaskChatMessage> {
    try {
      const response = await apiPost('/api/v1/messages/task-chat', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending task chat message:', error);
      throw error;
    }
  }

  /**
   * Get task chat messages
   * @param taskId - Task ID
   * @param skip - Number of messages to skip
   * @param limit - Maximum number of messages to return
   * @returns Promise<MessageListResponse<TaskChatMessage>>
   */
  static async getTaskChatMessages(
    taskId: number,
    skip: number = 0,
    limit: number = 50
  ): Promise<MessageListResponse<TaskChatMessage>> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiGet(`/api/v1/messages/task-chat/${taskId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task chat messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * @param messageIds - Array of message IDs to mark as read
   * @returns Promise<any>
   */
  static async markMessagesAsRead(messageIds: number[]): Promise<any> {
    try {
      const response = await apiPost('/api/v1/messages/mark-read', {
        message_ids: messageIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Update user status
   * @param statusData - User status update data
   * @returns Promise<UserStatus>
   */
  static async updateUserStatus(
    statusData: UserStatusUpdateRequest
  ): Promise<UserStatus> {
    try {
      const response = await apiPost('/api/v1/messages/users/status', statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Get user status
   * @param userId - User ID
   * @returns Promise<UserStatus>
   */
  static async getUserStatus(userId: number): Promise<UserStatus> {
    try {
      const response = await apiGet(`/api/v1/messages/users/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user status:', error);
      throw error;
    }
  }

  /**
   * Get online users
   * @param limit - Maximum number of users to return
   * @returns Promise<OnlineUsersResponse>
   */
  static async getOnlineUsers(limit: number = 100): Promise<OnlineUsersResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      
      const response = await apiGet(`/api/v1/messages/users/online?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   * @param typingData - Typing indicator request data
   * @returns Promise<any>
   */
  static async sendTypingIndicator(
    typingData: TypingIndicatorRequest
  ): Promise<any> {
    try {
      const response = await apiPost('/api/v1/messages/typing', typingData);
      return response.data;
    } catch (error) {
      console.error('Error sending typing indicator:', error);
      throw error;
    }
  }
}
