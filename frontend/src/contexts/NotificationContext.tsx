/**
 * @fileoverview Notification Context for Real-time Notifications
 * @description Manages WebSocket notifications, toasts, and real-time updates
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getLoginState } from '../utils/cookies';
import { notificationService, Notification as StoredNotification } from '../services/notificationService';

export interface NotificationData {
  id: string;
  type: 'task_comment' | 'task_assigned' | 'task_completed' | 'workflow_transition' | 'approval_request' | 'message' | 'mention';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any; // Additional notification-specific data
  actionUrl?: string; // URL to navigate to when clicked
  storedId?: number; // ID from database for stored notifications
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // Auto-dismiss duration in ms
  persistent?: boolean; // Don't auto-dismiss
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

interface NotificationContextValue {
  // Notifications
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Stored notifications management
  refreshStoredNotifications: () => Promise<void>;
  markStoredAsRead: (storedIds: number[]) => Promise<void>;
  deleteStoredNotifications: (storedIds: number[]) => Promise<void>;
  
  // Toasts
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (toastId: string) => void;
  
  // WebSocket status
  isConnected: boolean;
  connectionError: string | null;
  
  // Navigation
  navigateFromNotification: (actionUrl: string) => void;
  
  // Real-time updates
  onNotificationReceived?: (notification: NotificationData) => void;
  setOnNotificationReceived: (callback: (notification: NotificationData) => void) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * @description Notification Provider Component
 */
export const NotificationProvider: React.FC<{ 
  children: React.ReactNode;
  onNavigation?: (pageId: string, taskId?: number) => void;
}> = ({ children, onNavigation }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [onNotificationReceived, setOnNotificationReceived] = useState<((notification: NotificationData) => void) | undefined>();
  
  /**
   * @description Convert stored notification to NotificationData format
   */
  const convertStoredNotification = useCallback((stored: StoredNotification): NotificationData => {
    // Map notification type from backend to frontend format
    const typeMapping: Record<string, NotificationData['type']> = {
      'task_comment': 'task_comment',
      'task_assigned': 'task_assigned',
      'task_status_changed': 'workflow_transition',
      'task_approval_request': 'approval_request',
      'task_approved': 'approval_request',
      'task_rejected': 'approval_request',
      'user_mentioned': 'mention',
      'direct_message': 'message',
      'task_chat_message': 'message'
    };

    const priority = stored.data?.requires_action ? 'high' : 'medium';

    return {
      id: `stored_${stored.id}`,
      type: typeMapping[stored.type] || 'task_comment',
      title: stored.title,
      message: stored.message,
      timestamp: stored.created_at,
      read: stored.is_read,
      priority: priority as NotificationData['priority'],
      data: stored.data,
      actionUrl: stored.action_url || undefined,
      storedId: stored.id
    };
  }, []);

  /**
   * @description Fetch stored notifications from the backend
   */
  const refreshStoredNotifications = useCallback(async () => {
    try {
      const loginState = getLoginState();
      if (!loginState || !loginState.userId) {
        console.log('🔔 No authenticated user, skipping stored notification fetch');
        return;
      }

      // Convert loginState to user object format expected by notificationService
      const user = {
        id: parseInt(loginState.userId),
        username: loginState.username,
        email: loginState.email,
        role: loginState.role || 'user' // Use actual role from login state or default to 'user'
      };


      const response = await notificationService.getNotifications(user, {
        skip: 0,
        limit: 100, // Get recent notifications
        unread_only: false
      });

      const storedNotifications = response.notifications.map(convertStoredNotification);
      
      // Merge with existing real-time notifications, avoiding duplicates
      setNotifications(prev => {
        const realTimeNotifications = prev.filter(n => !n.storedId);
        const combinedNotifications = [...realTimeNotifications, ...storedNotifications];
        
        // Sort by timestamp (newest first)
        return combinedNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });


    } catch (error) {
      console.error('Error fetching stored notifications:', error);
    }
  }, [convertStoredNotification]);

  /**
   * @description Mark stored notifications as read via API
   */
  const markStoredAsRead = useCallback(async (storedIds: number[]) => {
    try {
      const loginState = getLoginState();
      if (!loginState || !loginState.userId || storedIds.length === 0) {
        return;
      }

      // Convert loginState to user object format
      const user = {
        id: parseInt(loginState.userId),
        username: loginState.username,
        email: loginState.email,
        role: loginState.role || 'user'
      };

      console.log('🔔 Marking stored notifications as read:', storedIds);
      await notificationService.markNotificationsRead(user, storedIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.storedId && storedIds.includes(notification.storedId)
            ? { ...notification, read: true }
            : notification
        )
      );

      console.log('🔔 Marked', storedIds.length, 'stored notifications as read');
    } catch (error) {
      console.error('Error marking stored notifications as read:', error);
    }
  }, []);

  /**
   * @description Delete stored notifications via API
   */
  const deleteStoredNotifications = useCallback(async (storedIds: number[]) => {
    try {
      const loginState = getLoginState();
      if (!loginState || !loginState.userId || storedIds.length === 0) {
        return;
      }

      // Convert loginState to user object format
      const user = {
        id: parseInt(loginState.userId),
        username: loginState.username,
        email: loginState.email,
        role: loginState.role || 'user'
      };

      console.log('🔔 Deleting stored notifications:', storedIds);
      await notificationService.deleteNotifications(user, storedIds);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notification => 
          !notification.storedId || !storedIds.includes(notification.storedId)
        )
      );

      console.log('🔔 Deleted', storedIds.length, 'stored notifications');
    } catch (error) {
      console.error('Error deleting stored notifications:', error);
    }
  }, []);

  /**
   * @description Handle navigation from notification action URL
   */
  const handleNotificationNavigation = (actionUrl: string) => {
    console.log('🔔 NotificationContext: handleNotificationNavigation called with:', actionUrl);
    console.log('🔔 NotificationContext: onNavigation function available:', !!onNavigation);
    
    if (!onNavigation) {
      // Fallback to direct navigation if no handler provided
      console.log('🔔 NotificationContext: No navigation handler, using window.location');
      window.location.href = actionUrl;
      return;
    }

    // Parse task URLs for SPA navigation
    const taskMatch = actionUrl.match(/\/tasks\/(\d+)/);
    if (taskMatch) {
      const taskId = parseInt(taskMatch[1], 10);
      
      // For task notifications, always route to 'my-tasks' regardless of user role
      // Task notifications are always about tasks that are relevant to the current user
      // (either they created them, are assigned to them, or need to take action)
      const targetPage = 'my-tasks';
      
      console.log('🔔 Task notification -> routing to my-tasks with taskId:', taskId);
      onNavigation(targetPage, taskId);
      return;
    }

    // Handle other URL patterns
    const pathMatch = actionUrl.match(/\/(.+)/);
    if (pathMatch) {
      const pageId = pathMatch[1];
      console.log('🔔 NotificationContext: Calling onNavigation with:', pageId);
      onNavigation(pageId);
    } else {
      console.log('🔔 NotificationContext: Calling onNavigation with: dashboard');
      onNavigation('dashboard');
    }
  };
  
  // WebSocket connection for real-time notifications
  const notificationWS = useWebSocket({
    url: 'ws://localhost:8000/ws/notifications',
    autoConnect: false
  });

  /**
   * @description Handle incoming WebSocket messages
   */
  function handleWebSocketMessage(data: any) {
    try {
      console.log('📡 WebSocket message received:', data);
      
      // Handle different types of real-time updates
      switch (data.type) {
        case 'task_comment':
          console.log('📡 Processing task_comment notification');
          handleTaskCommentNotification(data);
          break;
        case 'task_assigned':
        case 'task_reassigned':
        case 'task_created':
          console.log('📡 Processing task_assigned notification');
          handleTaskAssignedNotification(data);
          break;
        case 'task_completed':
          console.log('📡 Processing task_completed notification');
          handleTaskCompletedNotification(data);
          break;
        case 'task_status_changed':
        case 'task_updated':
          console.log('📡 Processing workflow_transition notification');
          handleWorkflowTransitionNotification(data);
          break;
        case 'task_approval_request':
        case 'task_approved':
        case 'task_rejected':
          console.log('📡 Processing approval_request notification');
          handleApprovalRequestNotification(data);
          break;
        case 'direct_message':
        case 'task_chat_message':
          console.log('📡 Processing message notification');
          handleMessageNotification(data);
          break;
        case 'user_mentioned':
          console.log('📡 Processing mention notification');
          handleMentionNotification(data);
          break;
        case 'task_deleted':
        case 'task_due_soon':
        case 'task_overdue':
        case 'media_attached':
        case 'system_announcement':
          console.log('📡 Processing general notification');
          handleGeneralNotification(data);
          break;
        default:
          console.log('📡 Unknown notification type:', data.type, data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * @description Handle task comment notifications
   */
  function handleTaskCommentNotification(data: any) {
    console.log('🔔 Received task comment notification:', data);
    
    // Extract the actual data from the notification object
    const notificationData = data.data || data;
    
    const notification: NotificationData = {
      id: `comment_${notificationData.comment_id}_${Date.now()}`,
      type: 'task_comment',
      title: data.title || 'New Comment',
      message: data.message || `${notificationData.user?.username || 'Someone'} commented on "${notificationData.task_title || 'a task'}"`,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: notificationData,
      actionUrl: data.action_url || `/tasks/${notificationData.task_id}`
    };

    console.log('🔔 Adding notification to bell:', notification);
    addNotification(notification);
    
    // Show toast for immediate feedback
    console.log('🔔 Showing toast for comment notification');
    showToast({
      type: 'info',
      title: 'New Comment',
      message: notification.message,
      duration: 4000,
      actions: [{
        label: 'View',
        onClick: () => {
          // Navigate to task using SPA navigation
          console.log('🍞 Toast: View button clicked for:', notification.actionUrl);
          handleNotificationNavigation(notification.actionUrl!);
        }
      }]
    });
  }

  /**
   * @description Handle task assigned notifications
   */
  function handleTaskAssignedNotification(data: any) {
    const notification: NotificationData = {
      id: `assigned_${data.task_id}_${Date.now()}`,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You've been assigned to "${data.task_title || 'a task'}"`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      data: data,
      actionUrl: `/tasks/${data.task_id}`
    };

    addNotification(notification);
    
    showToast({
      type: 'info',
      title: 'Task Assigned',
      message: notification.message,
      duration: 6000,
      actions: [{
        label: 'View Task',
        onClick: () => {
          handleNotificationNavigation(notification.actionUrl!);
        }
      }]
    });
  }

  /**
   * @description Handle task completed notifications
   */
  function handleTaskCompletedNotification(data: any) {
    console.log('🔔 Received task completed notification:', data);
    
    const notificationData = data.data || data;
    
    const notification: NotificationData = {
      id: `completed_${notificationData.task_id}_${Date.now()}`,
      type: 'task_completed',
      title: data.title || 'Task Completed',
      message: data.message || `Task "${notificationData.task_title || 'Unknown'}" has been completed`,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: notificationData,
      actionUrl: data.action_url || `/tasks/${notificationData.task_id}`
    };

    console.log('🔔 Adding task completed notification to bell:', notification);
    addNotification(notification);
    
    // Show toast for immediate feedback
    showToast({
      type: 'success',
      title: 'Task Completed',
      message: notification.message,
      duration: 4000,
      actions: [{
        label: 'View Task',
        onClick: () => {
          handleNotificationNavigation(notification.actionUrl!);
        }
      }]
    });
  }

  /**
   * @description Handle workflow transition notifications
   */
  function handleWorkflowTransitionNotification(data: any) {
    console.log('🔔 Received workflow transition notification:', data);
    
    // Extract the actual data from the notification object
    const notificationData = data.data || data;
    
    const notification: NotificationData = {
      id: `workflow_${notificationData.task_id}_${Date.now()}`,
      type: 'workflow_transition',
      title: data.title || 'Task Status Changed',
      message: data.message || `"${notificationData.task_title || 'A task'}" moved to ${notificationData.new_status?.replace('_', ' ')}`,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: notificationData,
      actionUrl: data.action_url || `/tasks/${notificationData.task_id}`
    };

    console.log('🔔 Adding workflow notification to bell:', notification);
    addNotification(notification);
  }

  /**
   * @description Handle approval request notifications
   */
  function handleApprovalRequestNotification(data: any) {
    const notification: NotificationData = {
      id: `approval_${data.task_id}_${Date.now()}`,
      type: 'approval_request',
      title: 'Approval Requested',
      message: `"${data.task_title || 'A task'}" is ready for your approval`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'urgent',
      data: data,
      actionUrl: `/tasks/${data.task_id}`
    };

    addNotification(notification);
    
    showToast({
      type: 'warning',
      title: 'Approval Needed',
      message: notification.message,
      persistent: true,
      actions: [{
        label: 'Review',
        onClick: () => {
          handleNotificationNavigation(notification.actionUrl!);
        },
        variant: 'primary'
      }]
    });
  }

  /**
   * @description Handle message notifications
   */
  function handleMessageNotification(data: any) {
    const notification: NotificationData = {
      id: `message_${data.message_id}_${Date.now()}`,
      type: 'message',
      title: 'New Message',
      message: `${data.sender?.username || 'Someone'} sent you a message`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: data,
      actionUrl: `/messages/${data.conversation_id}`
    };

    addNotification(notification);
    
    showToast({
      type: 'info',
      title: 'New Message',
      message: notification.message,
      duration: 4000
    });
  }

  /**
   * @description Handle mention notifications
   */
  function handleMentionNotification(data: any) {
    const notification: NotificationData = {
      id: `mention_${data.task_id}_${Date.now()}`,
      type: 'mention',
      title: 'You were mentioned',
      message: `${data.user?.username || 'Someone'} mentioned you in "${data.task_title || 'a task'}"`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high',
      data: data,
      actionUrl: `/tasks/${data.task_id}`
    };

    addNotification(notification);
    
    showToast({
      type: 'info',
      title: 'Mentioned',
      message: notification.message,
      duration: 5000,
      actions: [{
        label: 'View',
        onClick: () => {
          handleNotificationNavigation(notification.actionUrl!);
        }
      }]
    });
  }

  /**
   * @description Handle general notifications (deleted, due soon, overdue, media, system)
   */
  function handleGeneralNotification(data: any) {
    console.log('🔔 Received general notification:', data);
    
    const notificationData = data.data || data;
    
    // Map notification types to display types
    const typeMapping: Record<string, NotificationData['type']> = {
      'task_deleted': 'task_comment', // Use existing type for now
      'task_due_soon': 'task_comment',
      'task_overdue': 'task_comment',
      'media_attached': 'task_comment',
      'system_announcement': 'task_comment'
    };
    
    const notification: NotificationData = {
      id: `general_${data.type}_${Date.now()}`,
      type: typeMapping[data.type] || 'task_comment',
      title: data.title || 'Notification',
      message: data.message || 'You have a new notification',
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      priority: data.priority || 'medium',
      data: notificationData,
      actionUrl: data.action_url || (notificationData.task_id ? `/tasks/${notificationData.task_id}` : '/dashboard')
    };

    console.log('🔔 Adding general notification to bell:', notification);
    addNotification(notification);
    
    // Show toast for immediate feedback
    showToast({
      type: data.type === 'system_announcement' ? 'info' : 'warning',
      title: notification.title,
      message: notification.message,
      duration: 5000,
      actions: [{
        label: 'View',
        onClick: () => {
          handleNotificationNavigation(notification.actionUrl!);
        }
      }]
    });
  }

  /**
   * @description Add a new notification
   */
  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Keep max 100 notifications
    
    // Call external callback if set
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  }, [onNotificationReceived]);

  /**
   * @description Show a toast notification
   */
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss non-persistent toasts
    if (!toast.persistent && toast.duration !== 0) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, []);

  /**
   * @description Dismiss a toast
   */
  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  /**
   * @description Mark notification as read (handles both real-time and stored)
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true }
          : n
      )
    );

    // If it's a stored notification, also update on the backend
    if (notification?.storedId) {
      try {
        await markStoredAsRead([notification.storedId]);
      } catch (error) {
        console.error('Failed to mark stored notification as read:', error);
        // Revert local state on error
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: false }
              : n
          )
        );
      }
    }
  }, [notifications, markStoredAsRead]);

  /**
   * @description Mark all notifications as read (handles both real-time and stored)
   */
  const markAllAsRead = useCallback(async () => {
    // Get stored notification IDs that are unread
    const unreadStoredIds = notifications
      .filter(n => !n.read && n.storedId)
      .map(n => n.storedId!)
      .filter(id => id !== undefined);

    // Update local state immediately
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );

    // Update stored notifications on the backend
    if (unreadStoredIds.length > 0) {
      try {
        await markStoredAsRead(unreadStoredIds);
      } catch (error) {
        console.error('Failed to mark all stored notifications as read:', error);
        // Revert local state on error
        setNotifications(prev => 
          prev.map(n => 
            n.storedId && unreadStoredIds.includes(n.storedId) 
              ? { ...n, read: false }
              : n
          )
        );
      }
    }
  }, [notifications, markStoredAsRead]);

  /**
   * @description Clear a specific notification
   */
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  /**
   * @description Clear all notifications (both local and stored)
   */
  const clearAllNotifications = useCallback(async () => {
    // Find all stored notifications (those with storedId)
    const storedIds = notifications
      .filter(notification => notification.storedId)
      .map(notification => notification.storedId!);
    
    // Delete stored notifications from database if any exist
    if (storedIds.length > 0) {
      try {
        await deleteStoredNotifications(storedIds);
      } catch (error) {
        console.error('Failed to delete stored notifications:', error);
        // Continue with local clearing even if database deletion fails
      }
    }
    
    // Clear all notifications from local state (both stored and real-time)
    setNotifications([]);
  }, [notifications, deleteStoredNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!notificationWS.isConnected) return;


    
    // Subscribe to all notification types
    const unsubscribers = [
      notificationWS.subscribe('task_comment', handleWebSocketMessage),
      notificationWS.subscribe('task_assigned', handleWebSocketMessage),
      notificationWS.subscribe('task_reassigned', handleWebSocketMessage),
      notificationWS.subscribe('task_created', handleWebSocketMessage),
      notificationWS.subscribe('task_completed', handleWebSocketMessage),
      notificationWS.subscribe('task_status_changed', handleWebSocketMessage),
      notificationWS.subscribe('task_updated', handleWebSocketMessage),
      notificationWS.subscribe('task_approval_request', handleWebSocketMessage),
      notificationWS.subscribe('task_approved', handleWebSocketMessage),
      notificationWS.subscribe('task_rejected', handleWebSocketMessage),
      notificationWS.subscribe('direct_message', handleWebSocketMessage),
      notificationWS.subscribe('task_chat_message', handleWebSocketMessage),
      notificationWS.subscribe('user_mentioned', handleWebSocketMessage),
      notificationWS.subscribe('task_deleted', handleWebSocketMessage),
      notificationWS.subscribe('task_due_soon', handleWebSocketMessage),
      notificationWS.subscribe('task_overdue', handleWebSocketMessage),
      notificationWS.subscribe('media_attached', handleWebSocketMessage),
      notificationWS.subscribe('system_announcement', handleWebSocketMessage)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [notificationWS.isConnected]);

  // Initialize WebSocket connection and load stored notifications when user is authenticated
  useEffect(() => {
    const loginState = getLoginState();
    if (loginState && loginState.userId) {

      
      // Load stored notifications first
      refreshStoredNotifications();
      
      // Then connect to WebSocket for real-time updates
      const timer = setTimeout(() => {
        notificationWS.connect();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      
    }
  }, [refreshStoredNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationWS.disconnect();
    };
  }, []);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshStoredNotifications,
    markStoredAsRead,
    deleteStoredNotifications,
    toasts,
    showToast,
    dismissToast,
    isConnected: notificationWS.isConnected,
    connectionError: notificationWS.error,
    navigateFromNotification: handleNotificationNavigation,
    onNotificationReceived,
    setOnNotificationReceived
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * @description Hook to use notification context
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
