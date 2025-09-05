/**
 * @fileoverview TaskDrawer Usage Example
 * @description Example component showing how to integrate and use the TaskDrawer
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button, Group, Card, Text, Badge, ActionIcon, Stack } from '@mantine/core';
import { IconPlus, IconEdit, IconEye } from '@tabler/icons-react';
import { TaskDrawer } from './TaskDrawer';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../../types/task';
import { taskService, TaskStatus as ServiceTaskStatus } from '../../services';
import { notifications } from '@mantine/notifications';

interface TaskDrawerExampleProps {
  /** Sample tasks to display */
  tasks?: Task[];
}

export function TaskDrawerExample({ tasks = [] }: TaskDrawerExampleProps) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleCreateTask = () => {
    setCurrentTask(null);
    setDrawerMode('create');
    setDrawerOpened(true);
    setError('');
  };

  const handleViewTask = (task: Task) => {
    setCurrentTask(task);
    setDrawerMode('view');
    setDrawerOpened(true);
    setError('');
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setDrawerMode('edit');
    setDrawerOpened(true);
    setError('');
  };

  const handleSaveTask = async (taskData: TaskCreateRequest | TaskUpdateRequest) => {
    try {
      setLoading(true);
      setError('');

      if (drawerMode === 'create') {
        // Convert types if needed for service compatibility
        const createData = {
          ...taskData,
          status: taskData.status as ServiceTaskStatus
        };
        await taskService.createTask(createData as any);
        notifications.show({
          title: 'Success',
          message: 'Task created successfully!',
          color: 'green'
        });
      } else if (drawerMode === 'edit' && currentTask) {
        // Convert types if needed for service compatibility
        const updateData = {
          ...taskData,
          status: taskData.status as ServiceTaskStatus
        };
        await taskService.updateTask(currentTask.id, updateData as any);
        notifications.show({
          title: 'Success',
          message: 'Task updated successfully!',
          color: 'green'
        });
      }

      setDrawerOpened(false);
      // In a real app, you would refresh the task list here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to save task. Please try again.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully!',
        color: 'green'
      });
      setDrawerOpened(false);
      // In a real app, you would refresh the task list here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task. Please try again.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpened(false);
    setCurrentTask(null);
    setError('');
  };

  // Mock available users (in a real app, load from API)  
  const availableUsers = [
    { 
      id: 1, 
      username: 'john_doe', 
      email: 'john@example.com', 
      role: 'user',
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      avatar: undefined,
      status: 'active' as any,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    },
    { 
      id: 2, 
      username: 'jane_smith', 
      email: 'jane@example.com', 
      role: 'user',
      first_name: 'Jane',
      last_name: 'Smith',
      full_name: 'Jane Smith',
      avatar: undefined,
      status: 'active' as any,
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    }
  ];

  // Mock current user for example (in a real app, get from auth context)
  const currentUser = {
    id: 1,
    username: 'current_user',
    email: 'current@example.com',
    role: 'admin' as any,
    first_name: 'Current',
    last_name: 'User',
    full_name: 'Current User',
    status: 'active' as any,
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={500}>Task Management Example</Text>
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreateTask}>
            Create New Task
          </Button>
        </Group>

        {/* Sample Task Cards */}
        {tasks.map((task) => (
          <Card key={task.id} withBorder p="md">
            <Group justify="space-between">
              <div style={{ flex: 1 }}>
                <Group gap="xs" mb="xs">
                  <Text fw={500}>{task.title}</Text>
                  <Badge color={task.status === 'done' ? 'green' : 'blue'} size="sm">
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge color={
                    task.priority === 'urgent' ? 'red' :
                    task.priority === 'high' ? 'orange' :
                    task.priority === 'medium' ? 'yellow' : 'green'
                  } size="sm">
                    {task.priority.toUpperCase()}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" lineClamp={2}>
                  {task.description}
                </Text>
                {task.assigned_to && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Assigned to: {task.assigned_to.username}
                  </Text>
                )}
              </div>
              <Group gap="xs">
                <ActionIcon variant="subtle" onClick={() => handleViewTask(task)}>
                  <IconEye size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" onClick={() => handleEditTask(task)}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        ))}

        {tasks.length === 0 && (
          <Card withBorder p="xl">
            <Text ta="center" c="dimmed">
              No tasks available. Click &quot;Create New Task&quot; to get started.
            </Text>
          </Card>
        )}
      </Stack>

      {/* Task Drawer */}
      <TaskDrawer
        opened={drawerOpened}
        onClose={handleCloseDrawer}
        task={currentTask}
        currentUser={currentUser as any}
        mode={drawerMode}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        availableUsers={availableUsers as any}
        loading={loading}
        error={error}
      />
    </>
  );
}