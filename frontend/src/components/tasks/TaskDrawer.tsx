/**
 * @fileoverview TaskDrawer Component
 * @description A right-side drawer for creating, modifying, and viewing task details with progress stepper
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  ActionIcon,
  Badge,
  Divider,
  MultiSelect,
  Avatar,
  Paper,
  ScrollArea,
  Alert,
  Stepper,
  Tabs,
  Tooltip,
  SimpleGrid,
  Card,
  Center,
  Transition,
  Box,
  Menu
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  IconCheck,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconUser,
  IconFlag,
  IconClock,
  IconTag,
  IconInfoCircle,
  IconChecklist,
  IconMessage,
  IconHistory,
  IconChevronDown
} from '@tabler/icons-react';
import { Task as TypesTask, TaskStatus, TaskPriority, TaskType, TaskCreateRequest, TaskUpdateRequest } from '../../types/task';
import { Task as ServiceTask } from '../../services/taskService';
import { User } from '../../types/user';
import { TaskMetadata } from './TaskMetadata';
import { userService, taskService } from '../../services';
import { SplitButton } from '../common/SplitButton/SplitButton';

interface TaskDrawerProps {
  /** Whether the drawer is open */
  opened: boolean;
  /** Function to close the drawer */
  onClose: () => void;
  /** Task ID to display/edit (null for creating new task) */
  taskId?: number | null;
  /** Drawer mode */
  mode: 'view' | 'create' | 'edit';
  /** Function called when task is saved */
  onSave?: (task: TaskCreateRequest | TaskUpdateRequest) => Promise<void>;
  /** Function called when task is deleted */
  onDelete?: (taskId: number) => Promise<void>;
  /** Current user for permission checking */
  currentUser?: User | null;
  /** Loading state for external operations */
  loading?: boolean;
  /** Error message for external operations */
  error?: string;
}

// Dynamic stepper configuration based on task status
const getDynamicSteps = (taskStatus: TaskStatus) => {
  const steps = [
    {
      key: 'start',
      label: taskStatus === 'todo' || taskStatus === 'assigned' ? 'Assigned' : 'Started',
      tooltip: taskStatus === 'todo' || taskStatus === 'assigned' ? 'Begin Task' : 'Task Started',
      icon: taskStatus === 'todo' || taskStatus === 'assigned' ? IconUser : IconClock,
      active: taskStatus !== 'todo',
      completed: taskStatus !== 'todo' && taskStatus !== 'assigned',
      clickable: taskStatus === 'assigned',
      nextStatus: 'in_progress' as TaskStatus
    },
    {
      key: 'complete', 
      label: taskStatus === 'in_progress' ? 'Complete' : taskStatus === 'review' || taskStatus === 'submitted_for_approval' ? 'Pending' : 'Reviewed',
      tooltip: taskStatus === 'in_progress' ? 'Submit for review' : taskStatus === 'review' || taskStatus === 'submitted_for_approval' ? 'Awaiting approval' : 'Review completed',
      icon: taskStatus === 'in_progress' ? IconFlag : taskStatus === 'review' || taskStatus === 'submitted_for_approval' ? IconClock : IconCheck,
      active: taskStatus === 'in_progress' || taskStatus === 'review' || taskStatus === 'submitted_for_approval',
      completed: taskStatus === 'done',
      clickable: taskStatus === 'in_progress',
      nextStatus: 'review' as TaskStatus
    },
    {
      key: 'done',
      label: 'Done',
      tooltip: 'Task completed',
      icon: IconCheck,
      active: false, // Never active - only completed
      completed: taskStatus === 'done',
      clickable: false, // Only reviewers/creators can mark as done
      nextStatus: 'done' as TaskStatus
    }
  ];
  
  return steps;
};

const priorityColors = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red'
};

const statusColors = {
  todo: 'gray',
  assigned: 'blue',
  in_progress: 'orange',
  review: 'yellow',
  submitted_for_approval: 'purple',
  done: 'green',
  cancelled: 'red'
};

export function TaskDrawer({
  opened,
  onClose,
  taskId,
  mode,
  onSave,
  onDelete,
  currentUser,
  loading = false,
  error
}: TaskDrawerProps) {
  // Form state
  const [formData, setFormData] = useState<TaskCreateRequest | TaskUpdateRequest>({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    type: 'feature' as TaskType,
    assigned_to_id: undefined,
    due_date: undefined,
    tags: []
  });

  const [activeTab, setActiveTab] = useState<string>('details');
  const [isEditMode, setIsEditMode] = useState(mode === 'create');
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [task, setTask] = useState<ServiceTask | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string>('');

  // Check if current user has permission to edit this task
  const canEditTask = () => {
    if (!task || !currentUser) return false;
    
    // Task creator can always edit
    if (task.created_by_id === currentUser.id) return true;
    
    // Admins can edit any task
    if (currentUser.role === 'admin') return true;
    
    // Organizers can edit any task
    if (currentUser.role === 'organizer') return true;
    
    return false;
  };

  // Check if current user can delete this task
  const canDeleteTask = () => {
    return canEditTask(); // Same permissions as editing for now
  };

  // Handle entering edit mode
  const handleEnterEditMode = () => {
    if (canEditTask()) {
      setIsEditMode(true);
    }
  };

  // Handle exiting edit mode (cancel changes)
  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset form data to original task data
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        type: (task.category?.name as TaskType) || 'feature',
        assigned_to_id: task.assigned_to_id,
        due_date: task.due_date,
        tags: task.tags?.map(tag => tag.name) || []
      });
    }
  };

  // Fetch task details when taskId or opened state changes
  useEffect(() => {
    const fetchTask = async () => {
      if (!opened || !taskId || mode === 'create') return;
      
      try {
        setTaskLoading(true);
        setTaskError('');
        const fetchedTask = await taskService.getTask(taskId);
        setTask(fetchedTask);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch task details';
        setTaskError(errorMsg);
        console.error('Failed to fetch task:', err);
      } finally {
        setTaskLoading(false);
      }
    };

    fetchTask();
  }, [opened, taskId, mode]);

  // Fetch available users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      if (!opened) return; // Only fetch when drawer is opened
      
      try {
        setUsersLoading(true);
        const users = await userService.getUsersForAssignment({
          exclude_inactive: true
        });
        setFetchedUsers(users);
      } catch (err) {
        console.error('Failed to fetch users for assignment:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [opened]);

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        type: (task.category?.name as TaskType) || 'feature',
        assigned_to_id: task.assigned_to_id,
        due_date: task.due_date,
        tags: task.tags?.map(tag => tag.name) || []
      });
      // Always start in view mode for existing tasks - user must click edit
      setIsEditMode(false);
    } else if (mode === 'create') {
      setFormData({
        title: '',
        description: '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        type: 'feature' as TaskType,
        assigned_to_id: undefined,
        due_date: undefined,
        tags: []
      });
      setIsEditMode(true);
    }
  }, [task, mode]);

  const handleSave = async () => {
    if (onSave) {
      await onSave(formData);
      // Exit edit mode after successful save (except for create mode)
      if (mode !== 'create') {
        setIsEditMode(false);
      }
    }
  };

  const handleDelete = async () => {
    if (task && onDelete) {
      await onDelete(task.id);
    }
  };

  const getCurrentStep = (steps: ReturnType<typeof getDynamicSteps>) => {
    if (!task) return 0;
    
    // If task is done, all steps are completed, so return beyond the last step
    // This makes all steps appear as completed in Mantine Stepper
    if (task.status === 'done') {
      return steps.length; // This makes all steps completed
    }
    
    // Find the current active step
    const activeStepIndex = steps.findIndex(step => step.active && !step.completed);
    if (activeStepIndex >= 0) return activeStepIndex;
    
    return 0;
  };

  // Handle step click to progress task status
  const handleStepClick = async (step: ReturnType<typeof getDynamicSteps>[0]) => {
    if (!step.clickable || !task || mode === 'view') return;
    
    // Update task status in form data
    const updateData = {
      ...formData,
      status: step.nextStatus
    };
    
    setFormData(updateData);
    
    // If we have an onSave callback, use it to persist the change immediately
    if (onSave) {
      try {
        await onSave(updateData);
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    }
  };

  const getDrawerTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Task';
      case 'edit':
        return task?.title ? `Edit: ${task.title}` : 'Edit Task';
      case 'view':
      default:
        return task?.title || (taskLoading ? 'Loading...' : 'Task Details');
    }
  };


  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <Title order={3}>{getDrawerTitle()}</Title>
      }
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {(error || taskError) && (
          <Alert color="red" icon={<IconInfoCircle size={16} />}>
            {error || taskError}
          </Alert>
        )}

        {taskLoading && (
          <Alert color="blue" icon={<IconInfoCircle size={16} />}>
            Loading task details...
          </Alert>
        )}

        {/* Task Metadata - only show for existing tasks */}
        {task && (
          <Paper p="md" withBorder>
            <TaskMetadata task={task as any} />
          </Paper>
        )}

        {/* Task Progress Stepper - only show for existing tasks */}
        {task && (() => {
          const steps = getDynamicSteps(task.status);
          const currentStep = getCurrentStep(steps);
          
          return (
            <Paper p="md" withBorder>
              <Text size="sm" fw={500} mb="md">Task Progress</Text>
              <Stepper
                active={currentStep}
                size="sm"
                orientation="horizontal"
                iconSize={46}
              >
                {steps.map((step) => {
                  const StepIcon = step.completed ? IconCheck : step.icon;
                  return (
                    <Stepper.Step
                      key={step.key}
                      icon={<StepIcon size={14} />}
                      label={step.label}
                      color={
                        step.completed ? 'green' :
                        step.active ? 'blue' : 'gray'
                      }
                      onClick={() => step.clickable && handleStepClick(step)}
                      style={{ 
                        cursor: step.clickable ? 'pointer' : 'default'
                      }}
                    />
                  );
                })}
              </Stepper>
              
              {/* Show tooltips for clickable steps */}
              <Group justify="space-between" mt="xs">
                {steps.map((step) => (
                  <Tooltip key={step.key} label={step.tooltip} disabled={!step.clickable}>
                    <div style={{ flex: 1 }}>
                      {step.clickable && (
                        <Text size="xs" c="dimmed" ta="center" style={{ cursor: 'pointer' }}>
                          Click to {step.tooltip.toLowerCase()}
                        </Text>
                      )}
                    </div>
                  </Tooltip>
                ))}
              </Group>
            </Paper>
          );
        })()}

        {/* Task Details Tabs with Actions */}
        <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
          <Group justify="space-between" align="center">
            <Tabs.List>
              <Tabs.Tab value="details" leftSection={<IconInfoCircle size={16} />}>
                Details
              </Tabs.Tab>
              {task && (
                <>
                  <Tabs.Tab value="comments" leftSection={<IconMessage size={16} />}>
                    Comments (0)
                  </Tabs.Tab>
                  <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                    History
                  </Tabs.Tab>
                </>
              )}
            </Tabs.List>

            {/* Edit/Delete SplitButton - only show for existing tasks on details tab */}
            {task && !isEditMode && activeTab === 'details' && (canEditTask() || canDeleteTask()) && (
              <SplitButton
                onClick={handleEnterEditMode}
                leftSection={<IconEdit size={16} />}
                disabled={!canEditTask()}
                size="sm"
                variant="filled"
                menuItems={[
                  ...(canDeleteTask() ? [{
                    label: 'Delete Task',
                    leftSection: <IconTrash size={16} />,
                    onClick: handleDelete,
                    color: 'red'
                  }] : [])
                ]}
              >
                Edit
              </SplitButton>
            )}
          </Group>

          <Tabs.Panel value="details" pt="md">
            {!isEditMode ? (
              /* Display Mode - Single attractive card layout */
              <Paper p="xl" radius="md" withBorder>
                <Stack gap="lg">
                  {/* Task Header with Title and Badges */}
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Title order={2} size="h2" fw={700} mb="xs">
                        {formData.title || 'Untitled Task'}
                      </Title>
                      {formData.description && (
                        <Text size="md" c="dimmed" lh={1.5} style={{ maxWidth: '600px' }}>
                          {formData.description}
                        </Text>
                      )}
                    </div>
                    <Group gap="sm" align="flex-start">
                      <Badge
                        size="lg"
                        variant="light"
                        color={statusColors[(formData.status || 'todo') as keyof typeof statusColors]}
                        style={{ fontSize: '0.75rem', height: '28px' }}
                      >
                        {(formData.status || 'todo').replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge
                        size="lg"
                        variant="filled"
                        color={priorityColors[(formData.priority || 'medium') as keyof typeof priorityColors]}
                        style={{ fontSize: '0.75rem', height: '28px' }}
                      >
                        {(formData.priority || 'medium').toUpperCase()}
                      </Badge>
                    </Group>
                  </Group>

                  <Divider />

                  {/* Task Details in Clean Grid */}
                  <SimpleGrid cols={3} spacing="xl" style={{ alignItems: 'flex-start' }}>
                    {/* Assignment */}
                    <div>
                      <Group gap="xs" mb="xs">
                        <IconUser size={18} color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                          Assigned To
                        </Text>
                      </Group>
                      {task?.assigned_user ? (
                        <Group gap="sm">
                          <Avatar size="sm" name={task.assigned_user.username} />
                          <Text fw={500} size="sm">
                            {task.assigned_user.username}
                          </Text>
                        </Group>
                      ) : (
                        <Text c="dimmed" size="sm" fs="italic">
                          Unassigned
                        </Text>
                      )}
                    </div>

                    {/* Due Date */}
                    <div>
                      <Group gap="xs" mb="xs">
                        <IconCalendar size={18} color="var(--mantine-color-orange-6)" />
                        <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                          Due Date
                        </Text>
                      </Group>
                      {formData.due_date ? (
                        <div>
                          <Text fw={500} size="sm">
                            {new Date(formData.due_date).toLocaleDateString()}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(formData.due_date).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Text>
                        </div>
                      ) : (
                        <Text c="dimmed" size="sm" fs="italic">
                          No due date
                        </Text>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <Group gap="xs" mb="xs">
                        <IconChecklist size={18} color="var(--mantine-color-green-6)" />
                        <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                          Type
                        </Text>
                      </Group>
                      <Text fw={500} size="sm" tt="capitalize">
                        {formData.type}
                      </Text>
                    </div>
                  </SimpleGrid>

                  {/* Timeline Section */}
                  {task && (
                    <>
                      <Divider />
                      <div>
                        <Group gap="xs" mb="sm">
                          <IconClock size={18} color="var(--mantine-color-purple-6)" />
                          <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                            Timeline
                          </Text>
                        </Group>
                        <Group gap="xl">
                          <div>
                            <Text size="xs" c="dimmed" mb={4}>Created</Text>
                            <Text size="sm" fw={500}>
                              {new Date(task.created_at).toLocaleDateString()}
                            </Text>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed" mb={4}>Last Updated</Text>
                            <Text size="sm" fw={500}>
                              {new Date(task.updated_at).toLocaleDateString()}
                            </Text>
                          </div>
                        </Group>
                      </div>
                    </>
                  )}

                  {/* Tags Section */}
                  {formData.tags && formData.tags.length > 0 && (
                    <>
                      <Divider />
                      <div>
                        <Group gap="xs" mb="sm">
                          <IconTag size={18} color="var(--mantine-color-teal-6)" />
                          <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                            Tags
                          </Text>
                        </Group>
                        <Group gap="xs">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" size="md" radius="sm">
                              {tag}
                            </Badge>
                          ))}
                        </Group>
                      </div>
                    </>
                  )}
                </Stack>
              </Paper>
            ) : (
              /* Edit Mode - Form components */
              <Stack gap="md">
                {/* Title */}
                <TextInput
                  label="Title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  leftSection={<IconChecklist size={16} />}
                />

                {/* Description */}
                <Textarea
                  label="Description"
                  resize="vertical"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  minRows={3}
                  maxRows={8}
                  autosize
                />

                {/* Status, Priority, Type Row */}
                <SimpleGrid cols={3}>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
                    data={[
                      { value: 'todo', label: 'To Do' },
                      { value: 'assigned', label: 'Assigned' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'review', label: 'Review' },
                      { value: 'submitted_for_approval', label: 'Submitted for Approval' },
                      { value: 'done', label: 'Done' },
                      { value: 'cancelled', label: 'Cancelled' }
                    ]}
                    leftSection={
                      <Badge
                        size="xs"
                        color={statusColors[(formData.status || 'todo') as keyof typeof statusColors]}
                      />
                    }
                  />

                  <Select
                    label="Priority"
                    value={formData.priority}
                    onChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
                    data={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' }
                    ]}
                    leftSection={
                      <IconFlag
                        size={16}
                        color={`var(--mantine-color-${priorityColors[formData.priority as keyof typeof priorityColors]}-6)`}
                      />
                    }
                  />

                  <Select
                    label="Type"
                    value={formData.type}
                    onChange={(value) => setFormData(prev => ({ ...prev, type: value as TaskType }))}
                    data={[
                      { value: 'feature', label: 'Feature' },
                      { value: 'bug', label: 'Bug Fix' },
                      { value: 'improvement', label: 'Improvement' },
                      { value: 'documentation', label: 'Documentation' },
                      { value: 'maintenance', label: 'Maintenance' }
                    ]}
                  />
                </SimpleGrid>

                {/* Assignment and Due Date Row */}
                <SimpleGrid cols={2}>
                  <Select
                    label="Assigned To"
                    placeholder={usersLoading ? "Loading users..." : "Select user"}
                    value={formData.assigned_to_id?.toString()}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      assigned_to_id: value ? parseInt(value) : undefined 
                    }))}
                    data={fetchedUsers.map(user => ({
                      value: user.id.toString(),
                      label: user.username,
                    }))}
                    disabled={usersLoading}
                    leftSection={<IconUser size={16} />}
                    clearable
                  />

                  <DateTimePicker
                    label="Due Date & Time"
                    placeholder="Select due date and time"
                    value={formData.due_date || null}
                    onChange={(date: string | null) => setFormData(prev => ({ 
                      ...prev, 
                      due_date: date || undefined 
                    }))}
                    leftSection={<IconCalendar size={16} />}
                    clearable
                  />
                </SimpleGrid>

                {/* Tags */}
                <MultiSelect
                  label="Tags"
                  placeholder="Add tags"
                  value={formData.tags}
                  onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                  data={[]} // TODO: Load available tags from API
                  searchable
                  leftSection={<IconTag size={16} />}
                />
              </Stack>
            )}
          </Tabs.Panel>

          {task && (
            <Tabs.Panel value="comments" pt="md">
              <Text>Comments section - TODO: Implement comments component</Text>
            </Tabs.Panel>
          )}

          {task && (
            <Tabs.Panel value="history" pt="md">
              <Text>History section - TODO: Implement activity history</Text>
            </Tabs.Panel>
          )}
        </Tabs>

        {/* Action buttons */}
        {isEditMode && (
          <Group justify="flex-end" pt="md" gap="sm">
            <Button 
              variant="default" 
              onClick={mode === 'create' ? onClose : handleCancelEdit}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              loading={loading}
            >
              {mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </Group>
        )}
      </Stack>
    </Drawer>
  );
}