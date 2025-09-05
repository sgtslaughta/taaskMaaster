/**
 * @fileoverview TaskMetadata Component
 * @description Task metadata display component based on Mantine UI StatsSegments pattern
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { Box, Group, Text, Avatar } from '@mantine/core';
import { IconCalendar, IconUser, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Task } from '../../types/task';
import classes from './TaskMetadata.module.css';

interface TaskMetadataProps {
  task: Task;
}

export function TaskMetadata({ task }: TaskMetadataProps) {
  // Calculate days remaining or overdue
  const getDaysStatus = () => {
    if (!task.due_date) return null;
    
    const now = dayjs();
    const dueDate = dayjs(task.due_date);
    const diffDays = dueDate.diff(now, 'day');
    
    if (diffDays > 0) {
      return {
        label: 'Days Remaining',
        value: `${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        color: diffDays <= 3 ? 'orange' : 'blue',
        icon: IconClock
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        value: 'Today',
        color: 'orange',
        icon: IconAlertTriangle
      };
    } else {
      return {
        label: 'Overdue',
        value: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
        color: 'red',
        icon: IconAlertTriangle
      };
    }
  };

  const daysStatus = getDaysStatus();
  
  const metadata = [
    {
      label: 'Created By',
      value: task.created_by?.username || 'Unknown',
      color: 'blue',
      icon: IconUser,
      showAvatar: true as boolean | undefined
    },
    {
      label: 'Created Date',
      value: dayjs(task.created_at).format('MMM DD, YYYY'),
      color: 'gray',
      icon: IconCalendar,
      showAvatar: undefined as boolean | undefined
    },
    ...(task.due_date ? [{
      label: 'Due Date',
      value: dayjs(task.due_date).format('MMM DD, YYYY'),
      color: 'purple',
      icon: IconCalendar,
      showAvatar: undefined as boolean | undefined
    }] : []),
    ...(daysStatus ? [{
      ...daysStatus,
      showAvatar: undefined as boolean | undefined
    }] : [])
  ];

  return (
    <Box className={classes.container}>
      <Group gap="md" wrap="nowrap" justify="space-between">
        {metadata.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Box 
              key={stat.label} 
              className={classes.stat}
              style={{ 
                borderBottomColor: `var(--mantine-color-${stat.color}-5)`,
                flex: 1,
                minWidth: 0
              }}
            >
              <Group gap="xs" mb={4}>
                <IconComponent size={14} color={`var(--mantine-color-${stat.color}-6)`} />
                <Text tt="uppercase" fz="xs" c="dimmed" fw={700} truncate>
                  {stat.label}
                </Text>
              </Group>

              <Group justify="space-between" align="flex-end" gap="xs">
                <Group gap="xs" style={{ minWidth: 0 }}>
                  {stat.showAvatar && task.created_by && (
                    <Avatar 
                      size="xs" 
                      name={task.created_by.username}
                      color="blue"
                    />
                  )}
                  <Text fw={500} size="sm" truncate>
                    {stat.value}
                  </Text>
                </Group>
                {daysStatus && stat.label.includes('Day') && (
                  <Text 
                    c={stat.color} 
                    fw={700} 
                    size="xs" 
                    className={classes.statHighlight}
                  >
                    {stat.color === 'red' ? '!' : stat.color === 'orange' ? '⚠' : '✓'}
                  </Text>
                )}
              </Group>
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}