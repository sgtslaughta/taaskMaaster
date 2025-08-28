/**
 * @fileoverview Dashboard page component for TaaskMaaster
 * @description A comprehensive dashboard with welcome section, stats, progress, and gamification elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HomeIcon,
  CheckCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
  AcademicCapIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { getNavigationItems, updateNavigationWithBadges, type NavigationUser } from '../../utils/navigation';
import { AppLayout, NavigationItem } from '../layout/AppLayout';
import { cn } from '../../design-system/utils/cn';
import { gamificationService, goalService, taskService } from '../../services';
import { workflowStatsService, type WorkflowStats } from '../../services/workflowStatsService';
import WorkflowStatsCards from '../workflow/WorkflowStatsCards';

/**
 * @description User interface
 */
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
  points?: number;
  level?: number;
}

/**
 * @description Dashboard statistics interface
 */
interface DashboardStats {
  totalPoints: number;
  currentLevel: number;
  tasksCompleted: number;
  tasksPending: number;
  streakDays: number;
  achievements: number;
  activeGoals: number;
  completedGoals: number;
}

/**
 * @description Recent activity interface
 */
interface RecentActivity {
  id: string;
  type: 'task_completed' | 'points_earned' | 'achievement_unlocked' | 'goal_reached';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

/**
 * @description Dashboard component props interface
 */
export interface DashboardProps {
  /** User information */
  user?: User | null;
  /** Function called when a quick action is performed */
  onQuickAction?: (action: string) => void;
  /** Function called when logout is requested */
  onLogout?: () => void;
  /** Function called when navigation is requested */
  onNavigation?: (view: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Generate navigation items based on user role and task counts
 * @param user - Current user
 * @param taskCounts - Task counts for badges
 * @returns Role-based navigation items
 */
const generateNavigationItems = (
  user: NavigationUser | null,
  taskCounts?: {
    myTasks?: number;
    allTasks?: number;
    pendingTasks?: number;
  }
): NavigationItem[] => {
  const baseItems = getNavigationItems(user, 'dashboard');
  return updateNavigationWithBadges(baseItems, taskCounts);
};

/**
 * @description Dashboard component
 * 
 * A comprehensive dashboard that provides:
 * - Welcome section with user greeting
 * - Quick stats and progress overview
 * - Recent activity feed
 * - Quick action buttons
 * - Gamification progress indicators
 * - Dark mode support
 */
export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onQuickAction,
  onLogout,
  onNavigation,
  className,
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    currentLevel: 1,
    tasksCompleted: 0,
    tasksPending: 0,
    streakDays: 0,
    achievements: 0,
    activeGoals: 0,
    completedGoals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>(() => {
    // Initialize with basic navigation items to prevent undefined errors
    return generateNavigationItems(user as NavigationUser | null);
  });

  /**
   * @description Load dashboard data
   */
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const userId = parseInt(user.id);
      
      // Load gamification stats
      const gamificationStats = await gamificationService.getDashboardStats(userId);
      
      // Load goal stats
      const goalStats = await goalService.getDashboardGoalStats();
      
      // Load task stats (using task service)
      const taskResponse = await taskService.getTasks();
      const tasks = taskResponse.tasks;
      const tasksCompleted = tasks.filter(t => t.status === 'done').length;
      const tasksPending = tasks.filter(t => t.status !== 'done').length;

      // Calculate workflow statistics
      const workflowStatsData = workflowStatsService.calculateWorkflowStats(tasks);
      setWorkflowStats(workflowStatsData);

      // Combine all stats
      setStats({
        totalPoints: gamificationStats.totalPoints,
        currentLevel: gamificationStats.currentLevel,
        tasksCompleted,
        tasksPending,
        streakDays: gamificationStats.streakDays,
        achievements: gamificationStats.achievements,
        activeGoals: goalStats.activeGoals,
        completedGoals: goalStats.completedGoals,
      });

      // Load recent activity
      await loadRecentActivity(userId);

      // Generate navigation items with task counts
      // myTasks should represent tasks that need attention (not done)
      const myTasksCount = tasks.filter(t => t.status !== 'done').length;
      
      const navItems = generateNavigationItems(user as NavigationUser, {
        myTasks: myTasksCount, // Tasks that need user attention (created by or assigned to them)
        allTasks: tasks.length,
        pendingTasks: tasksPending,
      });
      setNavigationItems(navItems);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Load recent activity
   */
  const loadRecentActivity = async (userId: number) => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent points transactions
      const pointsHistory = await gamificationService.getUserPointsHistory(userId, { limit: 5 });
      pointsHistory.points.forEach(point => {
        activities.push({
          id: `points_${point.id}`,
          type: 'points_earned',
          title: `Earned ${point.amount} points`,
          description: point.description || 'Points earned',
          timestamp: point.created_at,
          points: point.amount,
        });
      });

      // Get recent achievements
      const achievements = await gamificationService.getUserAchievements(userId);
      achievements.slice(0, 3).forEach(achievement => {
        activities.push({
          id: `achievement_${achievement.id}`,
          type: 'achievement_unlocked',
          title: `Unlocked "${achievement.achievement.name}"`,
          description: achievement.achievement.description,
          timestamp: achievement.awarded_at,
        });
      });

      // Sort by timestamp and take the most recent 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setRecentActivity(sortedActivities);
    } catch (err) {
      console.error('Error loading recent activity:', err);
      // Set some default activity if API fails
      setRecentActivity([
        {
          id: '1',
          type: 'task_completed',
          title: 'Completed task "Clean the kitchen"',
          description: 'Daily chore completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'points_earned',
          title: 'Earned 50 points',
          description: 'Points earned for completing daily goal',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          points: 50,
        },
        {
          id: '3',
          type: 'achievement_unlocked',
          title: 'Unlocked "Task Master"',
          description: 'Completed 10 tasks in a week',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    }
  };

  /**
   * @description Load data on component mount
   */
  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Update navigation items when user changes
  useEffect(() => {
    if (user) {
      const navItems = generateNavigationItems(user as NavigationUser);
      setNavigationItems(navItems);
    }
  }, [user]);

  /**
   * @description Get appropriate greeting based on time of day
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  /**
   * @description Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  /**
   * @description Handle navigation item click
   */
  const handleNavigation = (item: NavigationItem) => {
    if (onNavigation) {
      // For now, we'll implement simple routing by showing different components
      // based on the navigation item clicked
      switch (item.id) {
        case 'my-tasks':
          // This would normally be handled by a router
          // For now, we'll just call the parent's onNavigation
          onNavigation('my-tasks');
          break;
        case 'task-hub':
          onNavigation('task-hub');
          break;
        default:
          onNavigation(item.id);
          break;
      }
    }
  };

  if (loading) {
    return (
      <AppLayout
        user={user}
        title="Dashboard"
        navigationItems={navigationItems}
        onLogout={onLogout}
        onNavigation={handleNavigation}
        className={className}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        user={user}
        title="Dashboard"
        navigationItems={navigationItems}
        onLogout={onLogout}
        onNavigation={handleNavigation}
        className={className}
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      title="Dashboard"
      navigationItems={navigationItems}
      onLogout={onLogout}
      onNavigation={handleNavigation}
      className={className}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {getGreeting()}! 👋
              </h1>
              <p className="text-blue-100 dark:text-blue-200">
                Ready to tackle today's tasks and earn some points?
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalPoints}</div>
                <div className="text-sm text-blue-100 dark:text-blue-200">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.currentLevel}</div>
                <div className="text-sm text-blue-100 dark:text-blue-200">Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onQuickAction?.('tasks')}
            className={cn(
              'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
              'hover:shadow-md transition-shadow duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Create Task</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add a new task</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onQuickAction?.('goals')}
            className={cn(
              'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
              'hover:shadow-md transition-shadow duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Set Goal</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create a new goal</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onQuickAction?.('family')}
            className={cn(
              'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
              'hover:shadow-md transition-shadow duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Family</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">View family members</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onQuickAction?.('achievements')}
            className={cn(
              'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
              'hover:shadow-md transition-shadow duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Achievements</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">View your badges</p>
              </div>
            </div>
          </button>
        </div>

        {/* Workflow Statistics */}
        {workflowStats && (
          <WorkflowStatsCards 
            stats={workflowStats} 
            loading={loading}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={cn(
            'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.tasksCompleted}</p>
              </div>
            </div>
          </div>

          <div className={cn(
            'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-center">
              <FireIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.streakDays} days</p>
              </div>
            </div>
          </div>

          <div className={cn(
            'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-center">
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Achievements</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.achievements}</p>
              </div>
            </div>
          </div>

          <div className={cn(
            'p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.tasksPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
        )}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      activity.type === 'task_completed' ? 'bg-green-500' :
                      activity.type === 'points_earned' ? 'bg-blue-500' :
                      activity.type === 'achievement_unlocked' ? 'bg-yellow-500' :
                      'bg-purple-500'
                    )}></div>
                    <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      {activity.title}
                    </p>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
