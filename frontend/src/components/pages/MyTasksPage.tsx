/**
 * @fileoverview My Tasks Page Component for TaaskMaaster
 * @description Personal task management page for regular users
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../layout/AppLayout';
import { Button } from '../../design-system/components/Button';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import StatsCarousel, { type StatsCarouselProps, type StatsData } from '../tasks/StatsCarousel';
import MyTasksTable, { type MyTasksTableProps } from '../tasks/MyTasksTable';
import { cn } from '../../design-system/utils/cn';
import { taskService, Task as FrontendTask, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../../services/taskService';
import { userService, User } from '../../services/userService';
import { invalidateUserCache } from '../../services/api';
import { getNavigationItems, updateNavigationWithBadges, type NavigationUser } from '../../utils/navigation';
import { NavigationItem } from '../navigation/Sidebar';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

/**
 * @description Task filter types for My Tasks page
 */
type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed';

/**
 * @description My Tasks page component props
 */
export interface MyTasksPageProps {
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
   * @description Navigation items (optional, will be generated if not provided)
   */
  navigationItems?: NavigationItem[];
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle navigation
   */
  onNavigation?: (item: any) => void;
  /**
   * @description Function to handle notification navigation
   */
  onNotificationNavigation?: (pageId: string, taskId?: number) => void;
  /**
   * @description Task ID to auto-open (from notification navigation)
   */
  initialTaskId?: number;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Adapter functions (reused from TasksPage)
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

const mapBackendStatusToFrontend = (backendStatus: TaskStatus): FrontendTask['status'] => {
  switch (backendStatus) {
    case TaskStatus.TODO:
      return 'todo';
    case TaskStatus.IN_PROGRESS:
      return 'in_progress';
    case TaskStatus.SUBMITTED_FOR_APPROVAL:
      return 'submitted_for_approval';
    case TaskStatus.REVIEW:
      return 'submitted_for_approval'; // Map legacy review to submitted_for_approval
    case TaskStatus.DONE:
      return 'done';
    case TaskStatus.CANCELLED:
      return 'cancelled';
    default:
      console.warn('Unknown backend status:', backendStatus);
      return 'todo';
  }
};

const mapFrontendStatusToBackend = (frontendStatus: FrontendTask['status']): TaskStatus => {
  switch (frontendStatus) {
    case 'todo':
      return TaskStatus.TODO;
    case 'in_progress':
      return TaskStatus.IN_PROGRESS;
    case 'submitted_for_approval':
      return TaskStatus.SUBMITTED_FOR_APPROVAL;
    case 'done':
      return TaskStatus.DONE;
    case 'cancelled':
      return TaskStatus.CANCELLED;
    default:
      console.warn('Unknown frontend status:', frontendStatus);
      return TaskStatus.TODO;
  }
};

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
 * @description My Tasks page component
 * @param props - My Tasks page component props
 * @returns My Tasks page component
 */
/**
 * @description Generate navigation items for My Tasks page
 */
const generateNavigationItems = (
  user: NavigationUser | null,
  taskCounts?: {
    myTasks?: number;
    allTasks?: number;
    pendingTasks?: number;
  }
): NavigationItem[] => {
  const baseItems = getNavigationItems(user, 'my-tasks');
  return updateNavigationWithBadges(baseItems, taskCounts);
};

export const MyTasksPage: React.FC<MyTasksPageProps> = ({
  user,
  navigationItems: providedNavigationItems,
  onLogout,
  onNavigation,
  onNotificationNavigation,
  initialTaskId,
  className,
}) => {
  const [tasks, setTasks] = useState<FrontendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<FrontendTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(() => {
    return providedNavigationItems || generateNavigationItems(user as NavigationUser | null);
  });

  // Load tasks and users on component mount
  useEffect(() => {
    loadMyTasks();
    loadUsers();
  }, []);

  // Handle auto-opening task modal from notification navigation
  useEffect(() => {
    console.log('MyTasksPage: Auto-open effect triggered. initialTaskId:', initialTaskId, 'tasks.length:', tasks.length);
    if (initialTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(task => task.id === initialTaskId);
      if (taskToOpen) {
        console.log('MyTasksPage: Auto-opening task from notification:', initialTaskId);
        setSelectedTask(taskToOpen);
        setIsDetailModalOpen(true);
      } else {
        console.warn('MyTasksPage: Task not found for auto-open:', initialTaskId, 'Available task IDs:', tasks.map(t => t.id));
      }
    } else if (initialTaskId) {
      console.log('MyTasksPage: initialTaskId provided but no tasks loaded yet:', initialTaskId);
    }
  }, [initialTaskId, tasks]);

  /**
   * @description Load user's tasks from API
   */
  const loadMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tasks assigned to current user only
      const currentUserId = parseInt(user.id);
      console.log('My Tasks: Loading tasks for user ID:', currentUserId, 'User:', user.username);
      // Don't pass any user filter - let the backend handle filtering by created_by OR assigned_to
      const response = await taskService.getTasks();
      console.log('My Tasks: Received tasks:', response.tasks?.length, 'tasks');
      
      const frontendTasks = response.tasks.map(adaptBackendToFrontendTask);
      
      // Debug: Log task details to check created_by vs assigned_to
      console.log('My Tasks Debug:', frontendTasks.map(t => ({
        id: t.id,
        title: t.title,
        createdById: t.createdById,
        assignedToId: t.assignedToId,
        status: t.status,
        currentUserId: parseInt(user?.id || '0')
      })));
      
      setTasks(frontendTasks);

      // Update navigation items with task counts
      // Filter to only tasks for current user, then count those needing attention
      const userTasks = frontendTasks.filter(task => 
        task.createdById === currentUserId || task.assignedToId === currentUserId
      );
      
      const taskStats = {
        myTasks: userTasks.filter(task => task.status !== 'done').length,
        allTasks: userTasks.length,
        pendingTasks: userTasks.filter(task => task.status !== 'done').length,
      };
      
      // Always update navigation items with current task counts, regardless of providedNavigationItems
      const navItems = generateNavigationItems(user as NavigationUser, taskStats);
      setNavigationItems(navItems);
    } catch (err) {
      setError('Failed to load your tasks. Please try again.');
      console.error('Error loading my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Load users for assignment (limited for regular users)
   */
  const loadUsers = async () => {
    try {
      const usersData = await userService.getUsersForAssignment();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  /**
   * @description Filter tasks based on active filter and search term
   */
  const filteredTasks = React.useMemo(() => {
    const currentUserId = parseInt(user?.id || '0');
    
    // First filter to only show tasks created by OR assigned to current user
    let userTasks = tasks.filter(task => 
      task.createdById === currentUserId || task.assignedToId === currentUserId
    );
    
    // Then apply search filter
    let filtered = userTasks.filter(task => {
      if (!searchTerm) return true;
      
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (task.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    
    // Then apply status filter
    switch (activeFilter) {
      case 'pending':
        return filtered.filter(task => task.status === 'todo');
      case 'in_progress':
        return filtered.filter(task => task.status === 'in_progress');
      case 'completed':
        return filtered.filter(task => task.status === 'done');
      default:
        return filtered;
    }
  }, [tasks, activeFilter, searchTerm, user?.id]);

  /**
   * @description Get enhanced task statistics
   */
  const taskStats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // First filter to only tasks for current user
    const currentUserId = parseInt(user?.id || '0');
    const userTasks = tasks.filter(task => 
      task.createdById === currentUserId || task.assignedToId === currentUserId
    );

    const pendingTasks = userTasks.filter(task => task.status === 'todo');
    const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');
    const completedTasks = userTasks.filter(task => task.status === 'done');
    const totalPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);

    // Calculate due dates
    const overdueTasks = userTasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    });

    const dueTodayTasks = userTasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === today.toDateString();
    });

    const dueThisWeekTasks = userTasks.filter(task => {
      if (!task.dueDate || task.status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });

    // Calculate high priority tasks
    const highPriorityTasks = userTasks.filter(task => 
      (task.priority === 'high' || task.priority === 'urgent') && task.status !== 'done'
    );

    // Get latest completed task
    const latestCompleted = completedTasks
      .sort((a, b) => {
        if (!a.completedAt && !b.completedAt) return 0;
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      })[0]?.title;

    // Calculate completion rate
    const totalNonCancelled = tasks.filter(task => task.status !== 'cancelled').length;
    const completionRate = totalNonCancelled > 0 
      ? Math.round((completedTasks.length / totalNonCancelled) * 100) 
      : 0;

    return {
      pending: pendingTasks.length,
      inProgress: inProgressTasks.length,
      completed: completedTasks.length,
      totalPoints,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      dueThisWeek: dueThisWeekTasks.length,
      highPriority: highPriorityTasks.length,
      latestCompleted,
      completionRate
    };
  }, [tasks, user?.id]);





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
    }
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
   * @description Handle navigation item click
   */
  const handleNavigation = (item: NavigationItem) => {
    if (onNavigation) {
      onNavigation(item.id);
    }
  };

  /**
   * @description Handle refresh button click - invalidate cache and reload tasks
   */
  const handleRefresh = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Invalidate user cache to force fresh data
      const currentUserId = parseInt(user.id);
      console.log('Refreshing: Invalidating cache for user ID:', currentUserId);
      
      await invalidateUserCache(currentUserId);
      console.log('Refreshing: Cache invalidated, loading fresh tasks');
      
      // Load fresh tasks
      await loadMyTasks();
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh tasks. Please try again.');
      setLoading(false);
    }
  };

  /**
   * @description Handle task click to show details
   */
  const handleTaskClick = (task: FrontendTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  /**
   * @description Handle closing task detail modal
   */
  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  /**
   * @description Check if user can edit a task - disabled in My Tasks page
   */
  const canEditTask = (task: FrontendTask): boolean => {
    // My Tasks page is read-only - editing should be done in Task Hub
    return false;
  };



  return (
    <AppLayout
      user={user}
      navigationItems={navigationItems}
      onLogout={onLogout}
      onNavigation={handleNavigation}
      onNotificationNavigation={onNotificationNavigation}
      className={className}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6 w-full max-w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View tasks assigned to you and track your progress. Use Task Hub to edit tasks.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Statistics Carousel */}
            <StatsCarousel
              stats={{
                total: tasks.length,
                pending: taskStats.pending,
                inProgress: taskStats.inProgress,
                completed: taskStats.completed,
                totalPoints: taskStats.totalPoints,
                overdue: taskStats.overdue,
                dueToday: taskStats.dueToday,
                dueThisWeek: taskStats.dueThisWeek,
                highPriority: taskStats.highPriority,
                latestCompleted: taskStats.latestCompleted,
                completionRate: taskStats.completionRate,
              }}
              autoRotate={true}
              rotationInterval={6000}
              animationDuration={500}
              itemsPerSlide={{
                desktop: 4,
                tablet: 3,
                mobile: 2
              }}
              showArrows={true}
              showDots={true}
            />

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex flex-col space-y-4">
                {/* Search and Filter Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search my tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    
                    {/* Filter Dropdown */}
                    <div className="flex items-center space-x-2">
                      <FunnelIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value as TaskFilter)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Tasks ({tasks.length})</option>
                        <option value="pending">Pending ({taskStats.pending})</option>
                        <option value="in_progress">In Progress ({taskStats.inProgress})</option>
                        <option value="completed">Completed ({taskStats.completed})</option>
                      </select>
                    </div>
                    
                    {/* Clear Filters */}
                    {(searchTerm || activeFilter !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setActiveFilter('all');
                        }}
                        className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                  
                  {/* Task Count */}
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="min-h-[400px]">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <MyTasksTable
                tasks={filteredTasks}
                loading={loading}
                onTaskClick={handleTaskClick}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal - Read-only in My Tasks */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
        users={users}
        loading={loading}
        canEdit={false}
        currentUser={user}
      />
    </AppLayout>
  );
};
