/**
 * @fileoverview Dashboard page component for TaaskMaaster
 * @description A comprehensive dashboard with welcome section, stats, progress, and gamification elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { 
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, CardFooter } from '../../design-system';
import { Button } from '../../design-system';
import { cn } from '../../design-system/utils/cn';
import { AppLayout } from '../layout/AppLayout';
import { NavigationItem } from '../navigation/Sidebar';

/**
 * @description Dashboard stats interface
 */
export interface DashboardStats {
  /**
   * @description Total tasks completed today
   */
  tasksCompletedToday: number;
  /**
   * @description Total tasks completed this week
   */
  tasksCompletedWeek: number;
  /**
   * @description Current streak days
   */
  currentStreak: number;
  /**
   * @description Total points earned
   */
  totalPoints: number;
  /**
   * @description Current level
   */
  currentLevel: number;
  /**
   * @description Points to next level
   */
  pointsToNextLevel: number;
  /**
   * @description Family members count
   */
  familyMembers: number;
  /**
   * @description Goals achieved this month
   */
  goalsAchieved: number;
}

/**
 * @description Recent activity item interface
 */
export interface ActivityItem {
  /**
   * @description Unique identifier
   */
  id: string;
  /**
   * @description Activity type
   */
  type: 'task_completed' | 'goal_achieved' | 'streak_milestone' | 'level_up' | 'family_joined';
  /**
   * @description Activity title
   */
  title: string;
  /**
   * @description Activity description
   */
  description: string;
  /**
   * @description Activity timestamp
   */
  timestamp: Date;
  /**
   * @description User who performed the activity
   */
  user: string;
  /**
   * @description Points earned (if applicable)
   */
  points?: number;
  /**
   * @description Icon for the activity
   */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * @description Dashboard component props interface
 */
export interface DashboardProps {
  /**
   * @description User data
   */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Dashboard statistics
   */
  stats?: DashboardStats;
  /**
   * @description Recent activity items
   */
  activities?: ActivityItem[];
  /**
   * @description Function to handle quick actions
   */
  onQuickAction?: (action: string) => void;
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle navigation
   */
  onNavigation?: (view: string) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Default dashboard statistics
 */
const defaultStats: DashboardStats = {
  tasksCompletedToday: 5,
  tasksCompletedWeek: 23,
  currentStreak: 7,
  totalPoints: 1250,
  currentLevel: 8,
  pointsToNextLevel: 250,
  familyMembers: 4,
  goalsAchieved: 3,
};

/**
 * @description Default recent activities
 */
const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'task_completed',
    title: 'Completed "Clean Room"',
    description: 'Great job keeping your space tidy!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: 'Alex',
    points: 25,
    icon: CheckCircleIcon,
  },
  {
    id: '2',
    type: 'goal_achieved',
    title: 'Weekly Goal Achieved',
    description: 'Completed all daily tasks for 7 days!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: 'Alex',
    points: 100,
    icon: TrophyIcon,
  },
  {
    id: '3',
    type: 'streak_milestone',
    title: '7-Day Streak!',
    description: 'Keep up the amazing work!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    user: 'Alex',
    icon: FireIcon,
  },
  {
    id: '4',
    type: 'family_joined',
    title: 'Mom joined the family',
    description: 'Welcome to the team!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    user: 'Mom',
    icon: UserGroupIcon,
  },
];

/**
 * @description Dashboard component
 * @param props - Dashboard component props
 * @returns Dashboard component
 */
export const Dashboard: React.FC<DashboardProps> = ({
  user,
  stats = defaultStats,
  activities = defaultActivities,
  onQuickAction,
  onLogout,
  onNavigation,
  className,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getProgressPercentage = () => {
    const totalPointsForLevel = 1000; // Assuming 1000 points per level
    const currentLevelPoints = stats.currentLevel * totalPointsForLevel;
    const totalPointsInLevel = stats.totalPoints - currentLevelPoints;
    return Math.min((totalPointsInLevel / totalPointsForLevel) * 100, 100);
  };

  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  // Default navigation items for the sidebar
  const defaultNavigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      href: '/dashboard',
      icon: ChartBarIcon,
      active: true,
    },
    {
      id: 'tasks',
      name: 'Tasks',
      href: '/tasks',
      icon: CheckCircleIcon,
    },
    {
      id: 'goals',
      name: 'Goals',
      href: '/goals',
      icon: TrophyIcon,
    },
    {
      id: 'family',
      name: 'Family',
      href: '/family',
      icon: UserGroupIcon,
    },
    {
      id: 'reports',
      name: 'Reports',
      href: '/reports',
      icon: ChartBarIcon,
    },
  ];

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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {getGreeting()}! 👋
              </h1>
              <p className="text-blue-100">
                Ready to tackle today's tasks and earn some points?
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalPoints}</div>
                <div className="text-sm text-blue-100">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.currentLevel}</div>
                <div className="text-sm text-blue-100">Level</div>
              </div>
            </div>
          </div>
        </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          size="lg"
          leftIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => handleQuickAction('add-task')}
          className="h-20 flex-col"
        >
          <span>Add Task</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          leftIcon={<TrophyIcon className="h-5 w-5" />}
          onClick={() => handleQuickAction('create-goal')}
          className="h-20 flex-col"
        >
          <span>Create Goal</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          leftIcon={<UserGroupIcon className="h-5 w-5" />}
          onClick={() => handleQuickAction('invite-family')}
          className="h-20 flex-col"
        >
          <span>Invite Family</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          leftIcon={<ChartBarIcon className="h-5 w-5" />}
          onClick={() => handleQuickAction('view-progress')}
          className="h-20 flex-col"
        >
          <span>View Progress</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tasks Completed Today */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tasks Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasksCompletedToday}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FireIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasksCompletedWeek}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Goals Achieved */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.goalsAchieved}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Progress and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Level Progress */}
        <Card>
          <CardHeader title="Level Progress" subtitle={`Level ${stats.currentLevel} • ${stats.pointsToNextLevel} points to next level`} />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Progress to Level {stats.currentLevel + 1}</span>
                <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{stats.totalPoints} points</span>
                <span>{(stats.currentLevel + 1) * 1000} points</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Family Overview */}
        <Card>
          <CardHeader title="Family Overview" subtitle={`${stats.familyMembers} family members`} />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Family Points</span>
                <span className="text-sm font-medium text-gray-900">3,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Family Level</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tasks Completed Today</span>
                <span className="text-sm font-medium text-gray-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Streaks</span>
                <span className="text-sm font-medium text-gray-900">3</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest family achievements and activities" />
        <CardBody>
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon || CheckCircleIcon;
              const getActivityColor = () => {
                switch (activity.type) {
                  case 'task_completed': return 'text-green-600 bg-green-100';
                  case 'goal_achieved': return 'text-yellow-600 bg-yellow-100';
                  case 'streak_milestone': return 'text-orange-600 bg-orange-100';
                  case 'level_up': return 'text-purple-600 bg-purple-100';
                  case 'family_joined': return 'text-blue-600 bg-blue-100';
                  default: return 'text-gray-600 bg-gray-100';
                }
              };

              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={cn('p-2 rounded-lg', getActivityColor())}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-400">
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {activity.points && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-green-600 font-medium">
                            +{activity.points} points
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
        <CardFooter>
          <Button variant="outline" size="sm" fullWidth>
            View All Activity
          </Button>
        </CardFooter>
      </Card>
      </div>
    </AppLayout>
  );
};
