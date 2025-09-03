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
  UserCircleIcon,
  PlusCircleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * @description Task filter types for My Tasks page
 */
type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed';

/**
 * @description Comprehensive filter options for My Tasks page
 */
interface MyTasksFilters {
  status: string;
  priority: string;
  category: string;
  assignee: string;
  rewardType: string;
}

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
   * @description Notification trigger counter to force modal re-opening
   */
  notificationTrigger?: number;
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
  notificationTrigger,
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
  const [activeTab, setActiveTab] = useState<'assigned' | 'created'>('assigned');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MyTasksFilters>({
    status: '',
    priority: '',
    category: '',
    assignee: '',
    rewardType: ''
  });
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
    if (initialTaskId && tasks.length > 0 && notificationTrigger !== undefined && notificationTrigger > 0) {
      const taskToOpen = tasks.find(task => task.id === initialTaskId);
      if (taskToOpen) {
        // Only open modal if it's not already open for this task or if it's closed
        const shouldOpenModal = !isDetailModalOpen || selectedTask?.id !== initialTaskId;
        
        if (shouldOpenModal) {
          setSelectedTask(taskToOpen);
          setIsDetailModalOpen(true);
        }
      }
    }
  }, [notificationTrigger, tasks]); // Changed dependency from initialTaskId to notificationTrigger

  /**
   * @description Load user's tasks from API
   */
  const loadMyTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get tasks assigned to current user only
      const currentUserId = parseInt(user.id);

      // Don't pass any user filter - let the backend handle filtering by created_by OR assigned_to
      const response = await taskService.getTasks();

      
      const frontendTasks = response.tasks.map(adaptBackendToFrontendTask);
      

      
      setTasks(frontendTasks);

      // Update navigation items with task counts
      // Filter to only tasks for current user, then count those needing attention
      const userTasksForNav = frontendTasks.filter(task => 
        task.createdById === currentUserId || task.assignedToId === currentUserId
      );
      
      const taskStats = {
        myTasks: userTasksForNav.filter(task => task.status !== 'done').length,
        allTasks: userTasksForNav.length,
        pendingTasks: userTasksForNav.filter(task => task.status !== 'done').length,
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
   * @description Handle filter changes
   */
  const handleFilterChange = (filterKey: keyof MyTasksFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  /**
   * @description Clear all filters
   */
  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      assignee: '',
      rewardType: ''
    });
    setSearchTerm('');
    setActiveFilter('all');
  };

  /**
   * @description Filter tasks based on active tab, comprehensive filters, and search term
   */
  const filteredTasks = React.useMemo(() => {
    const currentUserId = parseInt(user?.id || '0');
    
    // First filter based on active tab
    let tabFilteredTasks = tasks.filter(task => {
      if (activeTab === 'assigned') {
        return task.assignedToId === currentUserId;
      } else {
        return task.createdById === currentUserId;
      }
    });
    
    // Apply search filter
    let filtered = tabFilteredTasks.filter(task => {
      if (!searchTerm) return true;
      
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (task.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    
    // Apply comprehensive filters
    if (filters.status) {
      filtered = filtered.filter(task => {
        switch (filters.status) {
          case 'todo': return task.status === 'todo';
          case 'in_progress': return task.status === 'in_progress';
          case 'done': return task.status === 'done';
          case 'cancelled': return task.status === 'cancelled';
          default: return true;
        }
      });
    }
    
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    if (filters.category) {
      filtered = filtered.filter(task => {
        if (filters.category === 'uncategorized') {
          return !task.category || !task.category.name;
        }
        return task.category?.name?.toLowerCase() === filters.category.toLowerCase();
      });
    }
    
    if (filters.assignee) {
      filtered = filtered.filter(task => {
        if (filters.assignee === 'unassigned') {
          return !task.assignedToId;
        }
        return task.assignedToId?.toString() === filters.assignee;
      });
    }
    
    if (filters.rewardType) {
      filtered = filtered.filter(task => task.rewardType === filters.rewardType);
    }
    
    // Apply legacy activeFilter for backward compatibility
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
  }, [tasks, activeTab, activeFilter, searchTerm, filters, user?.id]);

  /**
   * @description Get tasks for current tab for statistics
   */
  const currentTabTasks = React.useMemo(() => {
    const currentUserId = parseInt(user?.id || '0');
    return tasks.filter(task => {
      if (activeTab === 'assigned') {
        return task.assignedToId === currentUserId;
      } else {
        return task.createdById === currentUserId;
      }
    });
  }, [tasks, activeTab, user?.id]);

  /**
   * @description Get user's tasks (created by or assigned to current user)
   */
  const userTasks = React.useMemo(() => {
    const currentUserId = parseInt(user?.id || '0');
    return tasks.filter(task => 
      task.createdById === currentUserId || task.assignedToId === currentUserId
    );
  }, [tasks, user?.id]);

  /**
   * @description Get enhanced task statistics
   */
  const taskStats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

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

    // Calculate completion rate (only for user's tasks)
    const totalNonCancelled = userTasks.filter(task => task.status !== 'cancelled').length;
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
  }, [userTasks]);





  /**
   * @description Handle task update
   */
  const handleTaskUpdate = async (taskId: number, updates: Partial<FrontendTask> | FrontendTask) => {
    try {
      // Check if this is a full task object (from TaskDetailModal's onRefreshTask) 
      // or partial updates that need backend API call
      const isFullTask = updates.hasOwnProperty('id') && updates.hasOwnProperty('title');
      
      if (isFullTask) {
        // Direct update from TaskDetailModal's refresh - just update local state
        const fullTask = updates as FrontendTask;
        setTasks(prev => prev.map(task => 
          task.id === taskId ? fullTask : task
        ));
        
        // If the updated task is currently selected in the modal, update it
        setSelectedTask(prev => 
          prev && prev.id === taskId ? fullTask : prev
        );
      } else {
        // Partial updates - make backend API call
        const partialUpdates = updates as Partial<FrontendTask>;
        const backendUpdates: UpdateTaskRequest = {};
        
        if (partialUpdates.title !== undefined) backendUpdates.title = partialUpdates.title;
        if (partialUpdates.description !== undefined) backendUpdates.description = partialUpdates.description;
        if (partialUpdates.status !== undefined) backendUpdates.status = mapFrontendStatusToBackend(partialUpdates.status);
        if (partialUpdates.priority !== undefined) backendUpdates.priority = mapFrontendPriorityToBackend(partialUpdates.priority);
        if (partialUpdates.dueDate !== undefined) backendUpdates.due_date = partialUpdates.dueDate;
        if (partialUpdates.points !== undefined) backendUpdates.points = partialUpdates.points;
        if (partialUpdates.assignedToId !== undefined) {
          backendUpdates.assigned_to_id = partialUpdates.assignedToId;
        }
        if (partialUpdates.assignedTo !== undefined) {
          // Handle assignedTo as user object with id property
          if (partialUpdates.assignedTo === null) {
            backendUpdates.assigned_to_id = null;
          } else if (typeof partialUpdates.assignedTo === 'object' && partialUpdates.assignedTo.id) {
            backendUpdates.assigned_to_id = parseInt(partialUpdates.assignedTo.id);
          } else if (typeof partialUpdates.assignedTo === 'string' || typeof partialUpdates.assignedTo === 'number') {
            backendUpdates.assigned_to_id = parseInt(partialUpdates.assignedTo.toString());
          }
        }
        if (partialUpdates.category !== undefined) {
          // Handle category update - backend expects category name as string
          backendUpdates.category = partialUpdates.category?.name || null;
        }

        const updatedBackendTask = await taskService.updateTask(taskId, backendUpdates);
        const updatedFrontendTask = adaptBackendToFrontendTask(updatedBackendTask);
        
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedFrontendTask : task
        ));
        
        // If the updated task is currently selected in the modal, update it
        setSelectedTask(prev => 
          prev && prev.id === taskId ? updatedFrontendTask : prev
        );
      }
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
      
      // Update tasks list
      setTasks(prev => prev.map(task => 
        task.id === taskId ? completedFrontendTask : task
      ));
      
      // If the completed task is currently selected in the modal, update it
      setSelectedTask(prev => 
        prev && prev.id === taskId ? completedFrontendTask : prev
      );
      
      // Invalidate cache to ensure fresh data on next load
      await api.invalidateUserCache();
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
                total: currentTabTasks.length,
                pending: currentTabTasks.filter(t => t.status === 'todo').length,
                inProgress: currentTabTasks.filter(t => t.status === 'in_progress').length,
                completed: currentTabTasks.filter(t => t.status === 'done').length,
                totalPoints: currentTabTasks.filter(t => t.status === 'done').reduce((sum, task) => sum + (task.points || 0), 0),
                overdue: currentTabTasks.filter(task => {
                  if (!task.dueDate || task.status === 'done') return false;
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return dueDate < today;
                }).length,
                dueToday: currentTabTasks.filter(task => {
                  if (!task.dueDate || task.status === 'done') return false;
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  return dueDate.toDateString() === today.toDateString();
                }).length,
                dueThisWeek: currentTabTasks.filter(task => {
                  if (!task.dueDate || task.status === 'done') return false;
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return dueDate >= today && dueDate <= nextWeek;
                }).length,
                highPriority: currentTabTasks.filter(task => 
                  (task.priority === 'high' || task.priority === 'urgent') && task.status !== 'done'
                ).length,
                latestCompleted: currentTabTasks
                  .filter(t => t.status === 'done')
                  .sort((a, b) => {
                    if (!a.completedAt && !b.completedAt) return 0;
                    if (!a.completedAt) return 1;
                    if (!b.completedAt) return -1;
                    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                  })[0]?.title,
                completionRate: currentTabTasks.filter(t => t.status !== 'cancelled').length > 0 
                  ? Math.round((currentTabTasks.filter(t => t.status === 'done').length / currentTabTasks.filter(t => t.status !== 'cancelled').length) * 100) 
                  : 0,
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

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setActiveTab('assigned');
                    setActiveFilter('all'); // Reset filter when switching tabs
                    setSearchTerm(''); // Reset search when switching tabs
                    handleClearFilters(); // Reset comprehensive filters when switching tabs
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'assigned'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <UserCircleIcon className="w-5 h-5" />
                    <span>Assigned to Me</span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                      {tasks.filter(task => task.assignedToId === parseInt(user?.id || '0')).length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('created');
                    setActiveFilter('all'); // Reset filter when switching tabs
                    setSearchTerm(''); // Reset search when switching tabs
                    handleClearFilters(); // Reset comprehensive filters when switching tabs
                  }}
                  className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'created'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>Created by Me</span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                      {tasks.filter(task => task.createdById === parseInt(user?.id || '0')).length}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4">
                <div className="flex flex-col space-y-4">
                  {/* Top Row - Search and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 max-w-md">
                      <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          placeholder={`Search ${activeTab === 'assigned' ? 'assigned' : 'created'} tasks...`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Filter Toggle */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                          "p-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors",
                          showFilters 
                            ? "bg-blue-600 text-white border-blue-600" 
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        )}
                        title="Toggle Filters"
                      >
                        <FunnelIcon className="w-4 h-4" />
                      </button>

                      {/* Refresh Button */}
                      <button
                        onClick={loadMyTasks}
                        disabled={loading}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh Tasks"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>

                      {/* Clear Filters */}
                      {(searchTerm || activeFilter !== 'all' || Object.values(filters).some(f => f !== '')) && (
                        <button
                          onClick={handleClearFilters}
                          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          title="Clear All Filters"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Count */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Status</option>
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <select
                        value={filters.priority}
                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>

                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Categories</option>
                        <option value="household">Household</option>
                        <option value="personal">Personal</option>
                        <option value="work">Work</option>
                        <option value="school">School</option>
                        <option value="health">Health</option>
                        <option value="other">Other</option>
                        <option value="uncategorized">Uncategorized</option>
                      </select>

                      <select
                        value={filters.assignee}
                        onChange={(e) => handleFilterChange('assignee', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Assignees</option>
                        <option value="unassigned">Unassigned</option>
                        {users && users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filters.rewardType}
                        onChange={(e) => handleFilterChange('rewardType', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">All Rewards</option>
                        <option value="points">Points</option>
                        <option value="monetary">Money</option>
                        <option value="time">Time</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  )}
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
        categories={['Household', 'Personal', 'Work', 'School', 'Health', 'Other']}
        onUpdateTask={handleTaskUpdate}
        loading={loading}
        canEdit={false}
        currentUser={user}
      />
    </AppLayout>
  );
};
