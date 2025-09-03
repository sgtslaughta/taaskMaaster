/**
 * @fileoverview Notification Bell Component - Simplified for Mantine Migration
 * @description Bell icon with notification dropdown - temporary implementation
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { 
  ActionIcon, 
  Indicator, 
  Menu, 
  Button, 
  Text, 
  Stack, 
  Center,
  Tooltip
} from '@mantine/core';
import { 
  IconBell,
  IconRefresh
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface NotificationBellProps {
  className?: string;
}

// Mock notification data for testing
const mockNotifications = [
  {
    id: '1',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Complete weekly report"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    title: 'Task Completed',
    message: 'Sarah completed "Clean the kitchen"',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false
  },
  {
    id: '3',
    title: 'Goal Progress',
    message: 'You\'re 75% complete with your weekly goals!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true
  }
];

/**
 * @description Notification Bell Component
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [mockNotifs, setMockNotifs] = useState(mockNotifications);

  const unreadCount = mockNotifs.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setMockNotifs(prev => prev.map(n => ({ ...n, read: true })));
    notifications.show({
      title: 'Notifications',
      message: 'All notifications marked as read',
      color: 'green',
    });
  };

  const handleRefresh = () => {
    notifications.show({
      title: 'Notifications',
      message: 'Refreshed notifications',
      color: 'blue',
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Menu position="bottom-end" width={350} shadow="lg">
      <Menu.Target>
        <Tooltip label="Notifications">
          <Indicator 
            inline 
            label={unreadCount > 99 ? '99+' : unreadCount} 
            size={16} 
            disabled={unreadCount === 0}
            color="red"
          >
            <ActionIcon 
              variant="subtle" 
              color="gray"
              size="lg"
              className={className}
            >
              <IconBell size={20} />
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text fw={600} size="lg">Notifications</Text>
        </Menu.Label>

        <Menu.Divider />

        <Menu.Item
          leftSection={<IconRefresh size={16} />}
          onClick={handleRefresh}
        >
          Refresh
        </Menu.Item>

        {unreadCount > 0 && (
          <Menu.Item onClick={handleMarkAllRead}>
            Mark all as read
          </Menu.Item>
        )}

        <Menu.Divider />

        {mockNotifs.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <IconBell size={48} color="var(--mantine-color-gray-4)" />
              <Text c="dimmed">No notifications yet</Text>
            </Stack>
          </Center>
        ) : (
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {mockNotifs.map((notification) => (
              <Menu.Item
                key={notification.id}
                style={{
                  backgroundColor: !notification.read ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' : 'transparent',
                  padding: '12px',
                  whiteSpace: 'normal',
                  height: 'auto'
                }}
              >
                <Stack gap={4}>
                  <Text size="sm" fw={notification.read ? 500 : 600}>
                    {notification.title}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'normal' }}>
                    {notification.message}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatTimestamp(notification.timestamp)}
                    {!notification.read && (
                      <> • <Text component="span" size="xs" c="blue">New</Text></>
                    )}
                  </Text>
                </Stack>
              </Menu.Item>
            ))}
          </div>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificationBell;