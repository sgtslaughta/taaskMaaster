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
  
  // Real-time updates
  onNotificationReceived?: (notification: NotificationData) => void;
  setOnNotificationReceived: (callback: (notification: NotificationData) => void) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * @description Notification Provider Component
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [onNotificationReceived, setOnNotificationReceived] = useState<((notification: NotificationData) => void) | undefined>();
  
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
      // Handle different types of real-time updates
      switch (data.type) {
        case 'task_comment':
          handleTaskCommentNotification(data);
          break;
        case 'task_assigned':
          handleTaskAssignedNotification(data);
          break;
        case 'task_completed':
          handleTaskCompletedNotification(data);
          break;
        case 'workflow_transition':
          handleWorkflowTransitionNotification(data);
          break;
        case 'approval_request':
          handleApprovalRequestNotification(data);
          break;
        case 'message':
          handleMessageNotification(data);
          break;
        case 'mention':
          handleMentionNotification(data);
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * @description Handle task comment notifications
   */
  function handleTaskCommentNotification(data: any) {
    const notification: NotificationData = {
      id: `comment_${data.comment_id}_${Date.now()}`,
      type: 'task_comment',
      title: 'New Comment',
      message: `${data.user?.username || 'Someone'} commented on "${data.task_title || 'a task'}"`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: data,
      actionUrl: `/tasks/${data.task_id}`
    };

    addNotification(notification);
    
    // Show toast for immediate feedback
    showToast({
      type: 'info',
      title: 'New Comment',
      message: notification.message,
      duration: 4000,
      actions: [{
        label: 'View',
        onClick: () => {
          // Navigate to task
          window.location.href = notification.actionUrl!;
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
          window.location.href = notification.actionUrl!;
        }
      }]
    });
  }

  /**
   * @description Handle workflow transition notifications
   */
  function handleWorkflowTransitionNotification(data: any) {
    const notification: NotificationData = {
      id: `workflow_${data.task_id}_${Date.now()}`,
      type: 'workflow_transition',
      title: 'Task Status Changed',
      message: `"${data.task_title || 'A task'}" moved to ${data.new_status?.replace('_', ' ')}`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: data,
      actionUrl: `/tasks/${data.task_id}`
    };

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
          window.location.href = notification.actionUrl!;
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
          window.location.href = notification.actionUrl!;
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
      console.log('Connecting to notification WebSocket...');
      // Add a small delay to ensure backend is ready
      const timer = setTimeout(() => {
        notificationWS.connect();
      }, 1000);
      
      return () => clearTimeout(timer);
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
