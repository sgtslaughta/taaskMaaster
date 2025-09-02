/**
 * @fileoverview Notification Context for Real-time Notifications
 * @description Manages WebSocket notifications, toasts, and real-time updates
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getLoginState } from '../utils/cookies';

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
      console.log('🔔 NotificationContext: Calling onNavigation with:', 'my-tasks', taskId);
      onNavigation('my-tasks', taskId);
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
          console.log('📡 Processing task_assigned notification');
          handleTaskAssignedNotification(data);
          break;
        case 'task_completed':
          console.log('📡 Processing task_completed notification');
          handleTaskCompletedNotification(data);
          break;
        case 'workflow_transition':
          console.log('📡 Processing workflow_transition notification');
          handleWorkflowTransitionNotification(data);
          break;
        case 'approval_request':
          console.log('📡 Processing approval_request notification');
          handleApprovalRequestNotification(data);
          break;
        case 'message':
          console.log('📡 Processing message notification');
          handleMessageNotification(data);
          break;
        case 'mention':
          console.log('📡 Processing mention notification');
          handleMentionNotification(data);
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
   * @description Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  /**
   * @description Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  /**
   * @description Clear a specific notification
   */
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  /**
   * @description Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Subscribe to WebSocket messages
  useEffect(() => {
    if (!notificationWS.isConnected) return;

    console.log('Setting up WebSocket subscriptions for notifications');
    
    // Subscribe to all notification types
    const unsubscribers = [
      notificationWS.subscribe('task_comment', handleWebSocketMessage),
      notificationWS.subscribe('task_assigned', handleWebSocketMessage),
      notificationWS.subscribe('task_completed', handleWebSocketMessage),
      notificationWS.subscribe('workflow_transition', handleWebSocketMessage),
      notificationWS.subscribe('approval_request', handleWebSocketMessage),
      notificationWS.subscribe('message', handleWebSocketMessage),
      notificationWS.subscribe('mention', handleWebSocketMessage)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [notificationWS.isConnected]);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    const loginState = getLoginState();
    if (loginState && loginState.userId) {
      console.log('🔌 Connecting to notification WebSocket for user:', loginState.userId);
      // Add a small delay to ensure backend is ready
      const timer = setTimeout(() => {
        notificationWS.connect();
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🔌 No authenticated user found, skipping WebSocket connection');
    }
  }, []);

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
