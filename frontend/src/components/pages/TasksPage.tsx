/**
 * @fileoverview Tasks Page Component for TaaskMaaster
 * @description Production tasks page with tabbed interface for task management
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { TaskForm, TaskFormData, Task as FrontendTask } from '../tasks';
import { AppLayout } from '../layout/AppLayout';
import { Button } from '../../design-system/components/Button';
import { getCommonBreadcrumbs } from '../navigation/Breadcrumb';
import { NavigationItem } from '../navigation/Sidebar';
import { TabNavigation, TabItem } from '../navigation/TabNavigation';
import { OverviewTab, TasksTab, ListsTab, TemplatesTab } from './tasks';
import { cn } from '../../design-system/utils/cn';
import { taskService, Task as BackendTask, TaskStatus, TaskPriority, TaskCategory, CreateTaskRequest, UpdateTaskRequest } from '../../services/taskService';
import { userService, User } from '../../services/userService';
import { 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  ListBulletIcon, 
  SwatchIcon 
} from '@heroicons/react/24/outline';

/**
 * @description Adapter functions to convert between backend and frontend interfaces
 */

/**
 * @description Convert backend Task to frontend Task
 */
const adaptBackendToFrontendTask = (backendTask: BackendTask): FrontendTask => {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description || '',
    status: mapBackendStatusToFrontend(backendTask.status),
    priority: mapBackendPriorityToFrontend(backendTask.priority),
    dueDate: backendTask.due_date || '',
    completedAt: backendTask.completed_at || '',
    estimatedHours: backendTask.estimated_hours,
    actualHours: backendTask.actual_hours,
    points: backendTask.points,
    rewardType: backendTask.reward_type,
    rewardValue: backendTask.reward_value,
    rewardDescription: backendTask.reward_description,
    isRecurring: backendTask.is_recurring,
    recurrencePattern: backendTask.recurrence_pattern,
    createdById: backendTask.created_by_id,
    assignedToId: backendTask.assigned_to_id,
    categoryId: backendTask.category_id,
    templateId: backendTask.template_id,
    parentTaskId: backendTask.parent_task_id,
    createdAt: backendTask.created_at,
    updatedAt: backendTask.updated_at,
    assignedTo: backendTask.assigned_to,
    category: backendTask.category,
    template: backendTask.template,
    tags: backendTask.tags || [],
    subtasks: backendTask.subtasks?.map(adaptBackendToFrontendTask) || [],
    dependencies: backendTask.dependencies || [],
    mediaAttachments: backendTask.media_attachments || [],
  };
};

/**
 * @description Convert frontend Task to backend Task (for updates)
 */
const adaptFrontendToBackendTask = (frontendTask: FrontendTask): Partial<BackendTask> => {
  return {
    title: frontendTask.title,
    description: frontendTask.description,
    status: mapFrontendStatusToBackend(frontendTask.status),
    priority: mapFrontendPriorityToBackend(frontendTask.priority),
    due_date: frontendTask.dueDate,
    points: frontendTask.points,
    reward_type: frontendTask.rewardType,
    reward_value: frontendTask.rewardValue,
    reward_description: frontendTask.rewardDescription,
    assigned_to_id: frontendTask.assignedTo ? parseInt(frontendTask.assignedTo) : undefined,
    parent_task_id: frontendTask.parentTaskId ? parseInt(frontendTask.parentTaskId) : undefined,
  };
};

/**
 * @description Map backend status to frontend status
 */
const mapBackendStatusToFrontend = (backendStatus: TaskStatus): FrontendTask['status'] => {
  switch (backendStatus) {
    case TaskStatus.TODO:
      return 'todo';
    case TaskStatus.IN_PROGRESS:
      return 'in_progress';
    case TaskStatus.DONE:
      return 'done';
    case TaskStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'todo';
  }
};

/**
 * @description Map frontend status to backend status
 */
const mapFrontendStatusToBackend = (frontendStatus: FrontendTask['status']): TaskStatus => {
  switch (frontendStatus) {
    case 'todo':
      return TaskStatus.TODO;
    case 'in_progress':
      return TaskStatus.IN_PROGRESS;
    case 'done':
      return TaskStatus.DONE;
    case 'cancelled':
      return TaskStatus.CANCELLED;
    default:
      return TaskStatus.TODO;
  }
};

/**
 * @description Map backend priority to frontend priority
 */
const mapBackendPriorityToFrontend = (backendPriority: TaskPriority): FrontendTask['priority'] => {
  switch (backendPriority) {
    case TaskPriority.LOW:
      return 'low';
    case TaskPriority.MEDIUM:
      return 'medium';
    case TaskPriority.HIGH:
      return 'high';
    case TaskPriority.URGENT:
      return 'urgent';
    default:
      return 'medium';
  }
};

/**
 * @description Map frontend priority to backend priority
 */
const mapFrontendPriorityToBackend = (frontendPriority: FrontendTask['priority']): TaskPriority => {
  switch (frontendPriority) {
    case 'low':
      return TaskPriority.LOW;
    case 'medium':
      return TaskPriority.MEDIUM;
    case 'high':
      return TaskPriority.HIGH;
    case 'urgent':
      return TaskPriority.URGENT;
    default:
      return TaskPriority.MEDIUM;
  }
};

/**
 * @description Tasks page component props
 */
export interface TasksPageProps {
  /**
   * @description User data
   */
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Navigation items
   */
  navigationItems?: NavigationItem[];
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle navigation
   */
  onNavigation?: (item: NavigationItem) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Tasks page component
 * @param props - Tasks page component props
 * @returns Tasks page component
 */
export const TasksPage: React.FC<TasksPageProps> = ({
  user,
  navigationItems = [],
  onLogout,
  onNavigation,
  className,
}) => {
  const [tasks, setTasks] = useState<FrontendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FrontendTask | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Define tabs
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: ClipboardDocumentListIcon,
    },
    {
      id: 'lists',
      label: 'Lists',
      icon: ListBulletIcon,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: SwatchIcon,
    },
  ];

  // Load tasks and categories on component mount
  useEffect(() => {
    loadTasks();
    loadCategories();
    loadUsers();
  }, []);

  /**
   * @description Load tasks from API
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getTasks();
      const frontendTasks = response.tasks.map(adaptBackendToFrontendTask);
      setTasks(frontendTasks);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Load categories from API
   */
  const loadCategories = async () => {
    try {
      const categoriesData = await taskService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  /**
   * @description Load users from API
   */
  const loadUsers = async () => {
    try {
      const usersData = await userService.getUsersForAssignment();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      // Set error state to display to user
      setError('Failed to load users. You may not have permission to view user list.');
      // Set empty array as fallback
      setUsers([]);
    }
  };

  /**
   * @description Handle task creation
   */
  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  /**
   * @description Convert TaskFormData to CreateTaskRequest
   */
  const convertToCreateRequest = (taskData: TaskFormData): CreateTaskRequest => {
    return {
      title: taskData.title,
      description: taskData.description,
      status: mapFrontendStatusToBackend(taskData.status as FrontendTask['status']),
      priority: mapFrontendPriorityToBackend(taskData.priority as FrontendTask['priority']),
      due_date: taskData.dueDate,
      points: taskData.points,
      reward_type: taskData.rewardType,
      reward_value: taskData.rewardValue,
      reward_description: taskData.rewardDescription,
      assigned_to_id: parseInt(taskData.assignedTo) || undefined,
      parent_task_id: taskData.parentTaskId ? parseInt(taskData.parentTaskId) : undefined,
      tags: taskData.tags,
    };
  };

  /**
   * @description Convert TaskFormData to UpdateTaskRequest
   */
  const convertToUpdateRequest = (taskData: TaskFormData): UpdateTaskRequest => {
    return {
      title: taskData.title,
      description: taskData.description,
      status: mapFrontendStatusToBackend(taskData.status as FrontendTask['status']),
      priority: mapFrontendPriorityToBackend(taskData.priority as FrontendTask['priority']),
      due_date: taskData.dueDate,
      points: taskData.points,
      reward_type: taskData.rewardType,
      reward_value: taskData.rewardValue,
      reward_description: taskData.rewardDescription,
      assigned_to_id: parseInt(taskData.assignedTo) || undefined,
      parent_task_id: taskData.parentTaskId ? parseInt(taskData.parentTaskId) : undefined,
      tags: taskData.tags,
    };
  };

  /**
   * @description Handle task form submission
   */
  const handleTaskSubmit = async (taskData: TaskFormData) => {
    try {
      setFormLoading(true);
      
      if (editingTask) {
        // Update existing task
        const updateData = convertToUpdateRequest(taskData);
        const updatedBackendTask = await taskService.updateTask(parseInt(editingTask.id), updateData);
        const updatedFrontendTask = adaptBackendToFrontendTask(updatedBackendTask);
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? updatedFrontendTask : task
        ));
      } else {
        // Create new task
        const createData = convertToCreateRequest(taskData);
        const newBackendTask = await taskService.createTask(createData);
        const newFrontendTask = adaptBackendToFrontendTask(newBackendTask);
        setTasks(prev => [newFrontendTask, ...prev]);
      }
      
      setIsFormOpen(false);
      setEditingTask(undefined);
    } catch (err) {
      console.error('Error saving task:', err);
      // In a real app, you'd show an error message to the user
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * @description Handle task update
   */
  const handleTaskUpdate = async (taskId: number, updates: Partial<FrontendTask>) => {
    try {
      const backendUpdates: UpdateTaskRequest = {};
      
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.status !== undefined) backendUpdates.status = mapFrontendStatusToBackend(updates.status);
      if (updates.priority !== undefined) backendUpdates.priority = mapFrontendPriorityToBackend(updates.priority);
      if (updates.dueDate !== undefined) backendUpdates.due_date = updates.dueDate;
      if (updates.points !== undefined) backendUpdates.points = updates.points;
      if (updates.estimatedHours !== undefined) backendUpdates.estimated_hours = updates.estimatedHours;
      if (updates.rewardType !== undefined) backendUpdates.reward_type = updates.rewardType;
      if (updates.rewardValue !== undefined) backendUpdates.reward_value = updates.rewardValue;
      if (updates.rewardDescription !== undefined) backendUpdates.reward_description = updates.rewardDescription;
      if (updates.assignedToId !== undefined) {
        backendUpdates.assigned_to_id = updates.assignedToId;
      }
      if (updates.assignedTo !== undefined) {
        backendUpdates.assigned_to_id = parseInt(updates.assignedTo) || undefined;
      }
      if (updates.parentTaskId !== undefined) backendUpdates.parent_task_id = updates.parentTaskId ? parseInt(updates.parentTaskId) : undefined;

      const updatedBackendTask = await taskService.updateTask(taskId, backendUpdates);
      const updatedFrontendTask = adaptBackendToFrontendTask(updatedBackendTask);
      

      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedFrontendTask : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  /**
   * @description Handle task deletion
   */
  const handleTaskDelete = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      // In a real app, you'd show an error message to the user
    }
  };

  /**
   * @description Handle task status change
   */
  const handleStatusChange = (taskId: number, status: FrontendTask['status']) => {
    handleTaskUpdate(taskId, { status });
  };

  /**
   * @description Handle task assignment
   */
  const handleTaskAssign = (taskId: number, userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      handleTaskUpdate(taskId, { assignedTo: userId });
    }
  };

  /**
   * @description Handle task edit
   */
  const handleTaskEdit = (task: FrontendTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  /**
   * @description Handle task completion
   */
  const handleTaskComplete = async (taskId: number) => {
    try {
      const completedBackendTask = await taskService.completeTask(taskId);
      const completedFrontendTask = adaptBackendToFrontendTask(completedBackendTask);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? completedFrontendTask : task
      ));
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  /**
   * @description Handle bulk task update
   */
  const handleBulkUpdate = async (taskIds: number[], updates: Partial<FrontendTask>) => {
    try {
      const bulkUpdateData = {
        task_ids: taskIds,
        updates: {
          title: updates.title,
          description: updates.description,
          status: updates.status ? mapFrontendStatusToBackend(updates.status) : undefined,
          priority: updates.priority ? mapFrontendPriorityToBackend(updates.priority) : undefined,
          due_date: updates.dueDate,
          points: updates.points,
          reward_type: updates.rewardType,
          reward_value: updates.rewardValue,
          reward_description: updates.rewardDescription,
          assigned_to_id: updates.assignedTo ? parseInt(updates.assignedTo) : undefined,
        }
      };

      const updatedBackendTasks = await taskService.bulkUpdateTasks(bulkUpdateData, 1); // TODO: Use actual user ID
      const updatedFrontendTasks = updatedBackendTasks.map(adaptBackendToFrontendTask);
      
      setTasks(prev => prev.map(task => {
        const updatedTask = updatedFrontendTasks.find(updated => updated.id === task.id);
        return updatedTask || task;
      }));
    } catch (err) {
      console.error('Error bulk updating tasks:', err);
    }
  };

  /**
   * @description Handle task export
   */
  const handleExport = async (exportData: any) => {
    try {
      const exportRequest = {
        format: exportData.format,
        filters: exportData.filters,
        include_completed: exportData.includeCompleted,
        date_range: exportData.dateRange ? {
          start: new Date(exportData.dateRange.start),
          end: new Date(exportData.dateRange.end)
        } : undefined
      };

      const exportedData = await taskService.exportTasks(exportRequest, 1); // TODO: Use actual user ID
      
      // Create and download file
      const blob = new Blob([exportedData], { 
        type: exportData.format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_export.${exportData.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting tasks:', err);
    }
  };

  /**
   * @description Convert frontend Task to TaskFormData
   */
  const convertTaskToFormData = (task: FrontendTask): TaskFormData => {
    return {
      title: task.title,
      description: task.description,
      status: task.status as any,
      priority: task.priority as any,
      category: task.category,
      tags: task.tags,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      points: task.points,
      rewardType: task.rewardType || 'points',
      rewardValue: task.rewardValue || 0,
      rewardDescription: task.rewardDescription || '',
      parentTaskId: task.parentTaskId,
      subtasks: task.subtasks?.map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        status: subtask.status as any,
      })),
    };
  };

  /**
   * @description Get category names for form
   */
  const getCategoryNames = (): string[] => {
    return categories.map(cat => cat.name);
  };

  /**
   * @description Get parent tasks for form
   */
  const getParentTasks = (): FrontendTask[] => {
    return tasks.filter(task => !task.parentTaskId);
  };



  return (
    <AppLayout
      user={user}
      navigationItems={navigationItems}
      onLogout={onLogout}
      onNavigation={onNavigation}
      className={className}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 w-full max-w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Organize, track, and complete tasks as a family
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => loadTasks()}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  onClick={handleCreateTask}
                >
                  Add Task
                </Button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px] w-full">
              {activeTab === 'overview' && (
                <OverviewTab
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  onRefresh={loadTasks}
                  className={className}
                />
              )}
              {activeTab === 'tasks' && (
                <TasksTab
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  onCreateTask={handleCreateTask}
                  onUpdateTask={handleTaskUpdate}
                  onDeleteTask={handleTaskDelete}
                  onStatusChange={handleStatusChange}
                  onAssignTask={handleTaskAssign}
                  onCompleteTask={handleTaskComplete}
                  onBulkUpdate={handleBulkUpdate}
                  onExport={handleExport}
                  onRefresh={loadTasks}
                  users={users}
                  className={className}
                />
              )}
              {activeTab === 'lists' && (
                <ListsTab className={className} />
              )}
              {activeTab === 'templates' && (
                <TemplatesTab className={className} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="hidden lg:block"
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        loading={formLoading}
        categories={getCategoryNames()}
        users={users}
        parentTasks={getParentTasks()}
      />
    </AppLayout>
  );
};
