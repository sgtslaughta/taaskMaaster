/**
 * @fileoverview Notification Bell Component
 * @description Bell icon with notification dropdown integrated with real-time notifications
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { 
  ActionIcon, 
  Indicator, 
  Menu, 
  Button, 
  Text, 
  Stack, 
  Center,
  Tooltip,
  Group,
  ScrollArea
} from '@mantine/core';
import { 
  IconBell,
  IconRefresh,
  IconCheck,
  IconTrash,
  IconBellOff
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNotifications } from '../../contexts/NotificationContext';

interface NotificationBellProps {
  className?: string;
}

/**
 * @description Notification Bell Component
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const {
    notifications: notificationList,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshStoredNotifications,
    navigateFromNotification,
    isConnected
  } = useNotifications();
  
  // Notifications are now loaded automatically on login
  const handleMenuOpen = useCallback(() => {
    // Menu opened - notifications are already loaded automatically
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    notifications.show({
      title: 'Notifications',
      message: 'All notifications marked as read',
      color: 'green',
    });
  };

  const handleRefresh = async () => {
    await refreshStoredNotifications();
    notifications.show({
      title: 'Notifications',
      message: 'Refreshed notifications',
      color: 'blue',
    });
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    notifications.show({
      title: 'Notifications',
      message: 'All notifications cleared',
      color: 'blue',
    });
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigateFromNotification(notification.actionUrl);
    }
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Menu position="bottom-end" width={400} shadow="lg" onOpen={handleMenuOpen}>
      <Menu.Target>
        <Tooltip label={`Notifications${!isConnected ? ' (Not Ready)' : ''}`}>
          <Indicator 
            inline 
            label={unreadCount > 99 ? '99+' : unreadCount} 
            size={16} 
            disabled={unreadCount === 0}
            color="red"
          >
            <div className={className} style={{ padding: 8, cursor: 'pointer', color: isConnected ? 'gray' : 'red' }}>
              {isConnected ? <IconBell size={20} /> : <IconBellOff size={20} />}
            </div>
          </Indicator>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between">
            <Text fw={600} size="lg">Notifications</Text>
            <Text size="xs" c="dimmed">
              {isConnected ? 'Ready' : 'Not authenticated'}
            </Text>
          </Group>
        </Menu.Label>

        <Menu.Divider />

        {/* Action buttons in a single row */}
        <div style={{ padding: '8px 12px' }}>
          <Group gap="xs" justify="space-between">
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleMarkAllRead}
                color="green"
              >
                Mark All Read
              </Button>
            )}
            
            {notificationList.length > 0 && (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={handleClearAll}
                color="red"
              >
                Clear All
              </Button>
            )}
          </Group>
        </div>

        <Menu.Divider />

        {notificationList.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconBell size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed">No notifications yet</Text>
            </Stack>
          </Center>
        ) : (
          <ScrollArea.Autosize mah={400} mx="-xs" px="xs">
            {notificationList.map((notification) => (
              <Menu.Item
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  backgroundColor: !notification.read 
                    ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-8))' 
                    : 'transparent',
                  padding: '12px',
                  whiteSpace: 'normal',
                  height: 'auto',
                  cursor: 'pointer'
                }}
              >
                <Group align="flex-start" gap="sm" wrap="nowrap">
                  <div 
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: !notification.read 
                        ? `var(--mantine-color-${getPriorityColor(notification.priority)}-6)`
                        : 'transparent',
                      flexShrink: 0,
                      marginTop: 6
                    }}
                  />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={notification.read ? 500 : 600} lineClamp={2}>
                      {notification.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={3}>
                      {notification.message}
                    </Text>
                    <Group justify="space-between" align="center">
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                      {!notification.read && (
                        <Text size="xs" c="blue" fw={600}>
                          NEW
                        </Text>
                      )}
                    </Group>
                  </Stack>
                  <Group gap={4}>
                    {!notification.read && (
                      <div
                        style={{ 
                          padding: 4, 
                          cursor: 'pointer', 
                          color: 'var(--mantine-color-green-6)',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <IconCheck size={12} />
                      </div>
                    )}
                    <div
                      style={{ 
                        padding: 4, 
                        cursor: 'pointer', 
                        color: 'var(--mantine-color-red-6)',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      title="Delete notification"
                    >
                      <IconTrash size={12} />
                    </div>
                  </Group>
                </Group>
              </Menu.Item>
            ))}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationBell;