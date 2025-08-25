/**
 * @fileoverview Dashboard page component for TaaskMaaster
 * @description A comprehensive dashboard with welcome section, stats, progress, and gamification elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
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
import { AppLayout, NavigationItem } from '../layout/AppLayout';
import { cn } from '../../design-system/utils/cn';

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
 * @description Default navigation items for the dashboard
 */
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: HomeIcon,
    active: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckCircleIcon,
    badge: 3,
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: TrophyIcon,
  },
  {
    id: 'family',
    name: 'Family',
    icon: UserGroupIcon,
  },
  {
    id: 'achievements',
    name: 'Achievements',
    icon: StarIcon,
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    icon: ChartBarIcon,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: CalendarIcon,
  },
  {
    id: 'streaks',
    name: 'Streaks',
    icon: FireIcon,
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: AcademicCapIcon,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Cog6ToothIcon,
  },
];

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
   * @description Mock statistics data
   */
  const stats = {
    totalPoints: user?.points || 1250,
    currentLevel: user?.level || 8,
    tasksCompleted: 24,
    tasksPending: 3,
    streakDays: 7,
    achievements: 12,
  };

  /**
   * @description Handle navigation item click
   */
  const handleNavigation = (item: NavigationItem) => {
    if (onNavigation) {
      onNavigation(item.id);
    }
  };

  return (
    <AppLayout
      user={user}
      title="Dashboard"
      navigationItems={defaultNavigationItems}
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
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Completed task "Clean the kitchen"
                </p>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Earned 50 points for completing daily goal
                </p>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">4 hours ago</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Unlocked achievement "Task Master"
                </p>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
