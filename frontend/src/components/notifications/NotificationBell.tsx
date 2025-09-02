/**
 * @fileoverview Notification Bell Component
 * @description Bell icon with notification count and dropdown for viewing notifications
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import { Button } from '../../design-system/components/Button';
import { useNotifications, type NotificationData } from '../../contexts/NotificationContext';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface NotificationBellProps {
  className?: string;
  onNavigation?: (pageId: string, taskId?: number) => void;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
  onNavigate: (url: string) => void;
  onDeleteStored?: (storedIds: number[]) => Promise<void>;
}

/**
 * @description Individual notification item component
 */
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClear,
  onNavigate,
  onDeleteStored
}) => {
  /**
   * @description Get notification icon based on type
   */
  const getIcon = () => {
    switch (notification.type) {
      case 'task_comment':
        return <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500" />;
      case 'task_assigned':
        return <UserIcon className="w-4 h-4 text-green-500" />;
      case 'task_completed':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'workflow_transition':
        return <DocumentTextIcon className="w-4 h-4 text-purple-500" />;
      case 'approval_request':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />;
      case 'message':
        return <ChatBubbleLeftIcon className="w-4 h-4 text-indigo-500" />;
      case 'mention':
        return <UserIcon className="w-4 h-4 text-yellow-500" />;
      default:
        return <BellIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  /**
   * @description Get priority color
   */
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-500';
    }
  };

  /**
   * @description Format timestamp
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  /**
   * @description Handle notification click
   */
  const handleClick = () => {
    console.log('🔔 NotificationItem: handleClick called for notification:', notification.id);
    console.log('🔔 NotificationItem: onNavigate function available:', !!onNavigate);
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      console.log('🔔 NotificationItem: Calling onNavigate with:', notification.actionUrl);
      console.log('🔔 NotificationItem: About to call onNavigate...');
      onNavigate(notification.actionUrl);
      console.log('🔔 NotificationItem: onNavigate call completed');
    } else {
      console.log('🔔 NotificationItem: No actionUrl available');
    }
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 border-l-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
        getPriorityColor(),
        !notification.read && "bg-blue-50 dark:bg-blue-900/10"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className={cn(
              "text-sm font-medium text-gray-900 dark:text-white",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <ClockIcon className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(notification.timestamp)}
              </span>
              {!notification.read && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 ml-2">
            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Mark as read"
              >
                <EyeIcon className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                // If it's a stored notification, delete it from the backend
                if (notification.storedId && onDeleteStored) {
                  try {
                    await onDeleteStored([notification.storedId]);
                  } catch (error) {
                    console.error('Failed to delete stored notification:', error);
                  }
                } else {
                  // Otherwise, just clear it locally
                  onClear(notification.id);
                }
              }}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear notification"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @description Notification Bell Component
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ className, onNavigation }) => {
  console.log('🔔 NotificationBell: Component rendered with onNavigation:', !!onNavigation);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshStoredNotifications,
    deleteStoredNotifications,
    isConnected,
    navigateFromNotification
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position on window resize (no need to reposition on scroll with fixed positioning)
  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      calculateDropdownPosition();
    };

    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen]);

  /**
   * @description Handle navigation to notification URL
   */
  const handleNavigate = (url: string) => {
    console.log('🔔 NotificationBell: handleNavigate called with URL:', url);
    console.log('🔔 NotificationBell: Using context navigation function');
    setIsOpen(false);
    
    // Use navigation function from context instead of props
    navigateFromNotification(url);
  };

  /**
   * @description Calculate dropdown position relative to viewport (for fixed positioning)
   */
  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 384; // w-96 = 384px
      
      // Calculate position
      let top = buttonRect.bottom + 8; // 8px gap below button
      let right = window.innerWidth - buttonRect.right; // Align right edge with button
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (right + dropdownWidth > window.innerWidth) {
        right = window.innerWidth - dropdownWidth - 16; // 16px margin from edge
      }
      if (right < 16) {
        right = 16; // Minimum 16px from left edge
      }
      
      // Ensure dropdown doesn't go off-screen vertically
      const dropdownHeight = 400; // Approximate max height
      if (top + dropdownHeight > window.innerHeight) {
        top = buttonRect.top - dropdownHeight - 8; // Show above button instead
      }
      if (top < 16) {
        top = 16; // Minimum 16px from top
      }
      
      setDropdownPosition({ top, right });
    }
  };

  /**
   * @description Toggle dropdown
   */
  const toggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={cn(
          "relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors",
          !isConnected && "text-red-500 dark:text-red-400"
        )}
        title={isConnected ? "Notifications" : "Disconnected from notifications"}
      >
        <BellIcon className="w-5 h-5" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status Indicator */}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
        )}
      </button>

      {/* Dropdown - Fixed positioning to break out of header container */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-[99999]"
          style={{ 
            zIndex: 99999,
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => refreshStoredNotifications()}
                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Refresh notifications"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={clearAllNotifications}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Connection Status */}
          {!isConnected && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  Disconnected from notifications
                </span>
              </div>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, 20).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onClear={clearNotification}
                    onNavigate={handleNavigate}
                    onDeleteStored={deleteStoredNotifications}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 20 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
