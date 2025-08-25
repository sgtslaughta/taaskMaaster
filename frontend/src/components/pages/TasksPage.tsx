/**
 * @fileoverview Tasks Page Component for TaaskMaaster
 * @description Production tasks page with full task management functionality
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { TaskList, TaskForm, TaskFormData, Task as FrontendTask } from '../tasks';
import { AppLayout } from '../layout/AppLayout';
import { Button } from '../../design-system/components/Button';
import { Card } from '../../design-system/components/Card';
import { getCommonBreadcrumbs } from '../navigation/Breadcrumb';
import { NavigationItem } from '../navigation/Sidebar';
import { cn } from '../../design-system/utils/cn';
import { taskService, Task as BackendTask, TaskStatus, TaskPriority, TaskCategory, CreateTaskRequest, UpdateTaskRequest } from '../../services/taskService';
import { userService, User } from '../../services/userService';

/**
 * @description Adapter functions to convert between backend and frontend interfaces
 */

/**
 * @description Convert backend Task to frontend Task
 */
const adaptBackendToFrontendTask = (backendTask: BackendTask): FrontendTask => {
  return {
    id: backendTask.id.toString(),
    title: backendTask.title,
    description: backendTask.description || '',
    status: mapBackendStatusToFrontend(backendTask.status),
    priority: mapBackendPriorityToFrontend(backendTask.priority),
    category: backendTask.category?.name || '',
    tags: backendTask.tags?.map(tag => tag.name) || [],
    assignedTo: backendTask.assigned_to_id?.toString() || '',
    dueDate: backendTask.due_date || '',
    points: backendTask.points,
    createdAt: backendTask.created_at,
    updatedAt: backendTask.updated_at,
    attachments: backendTask.attachments,
    parentTaskId: backendTask.parent_task_id?.toString(),
    subtasks: backendTask.subtasks?.map(adaptBackendToFrontendTask) || [],
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
      return 'pending';
    case TaskStatus.IN_PROGRESS:
      return 'in_progress';
    case TaskStatus.DONE:
      return 'completed';
    case TaskStatus.CANCELLED:
      return 'overdue';
    default:
      return 'pending';
  }
};

/**
 * @description Map frontend status to backend status
 */
const mapFrontendStatusToBackend = (frontendStatus: FrontendTask['status']): TaskStatus => {
  switch (frontendStatus) {
    case 'pending':
      return TaskStatus.TODO;
    case 'in_progress':
      return TaskStatus.IN_PROGRESS;
    case 'completed':
      return TaskStatus.DONE;
    case 'overdue':
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
  const handleTaskUpdate = async (taskId: string, updates: Partial<FrontendTask>) => {
    try {
      const backendUpdates: UpdateTaskRequest = {};
      
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.status !== undefined) backendUpdates.status = mapFrontendStatusToBackend(updates.status);
      if (updates.priority !== undefined) backendUpdates.priority = mapFrontendPriorityToBackend(updates.priority);
      if (updates.dueDate !== undefined) backendUpdates.due_date = updates.dueDate;
      if (updates.points !== undefined) backendUpdates.points = updates.points;
      if (updates.assignedTo !== undefined) backendUpdates.assigned_to_id = parseInt(updates.assignedTo) || undefined;
      if (updates.parentTaskId !== undefined) backendUpdates.parent_task_id = updates.parentTaskId ? parseInt(updates.parentTaskId) : undefined;

      const updatedBackendTask = await taskService.updateTask(parseInt(taskId), backendUpdates);
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
  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskService.deleteTask(parseInt(taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      // In a real app, you'd show an error message to the user
    }
  };

  /**
   * @description Handle task status change
   */
  const handleStatusChange = (taskId: string, status: FrontendTask['status']) => {
    handleTaskUpdate(taskId, { status });
  };

  /**
   * @description Handle task assignment
   */
  const handleTaskAssign = (taskId: string, userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
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
  const handleTaskComplete = async (taskId: string) => {
    try {
      const completedBackendTask = await taskService.completeTask(parseInt(taskId));
      const completedFrontendTask = adaptBackendToFrontendTask(completedBackendTask);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? completedFrontendTask : task
      ));
    } catch (err) {
      console.error('Error completing task:', err);
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

  /**
   * @description Get task statistics
   */
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  return (
    <AppLayout
      user={user}
      navigationItems={navigationItems}
      onLogout={onLogout}
      onNavigation={onNavigation}
      className={className}
    >
      <div className="space-y-6">
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

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">⏰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onStatusChange={handleStatusChange}
          onAssignTask={handleTaskAssign}
          className={className}
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
      </div>
    </AppLayout>
  );
};
