/**
 * @fileoverview Workflow Statistics Cards Component
 * @description Dashboard cards displaying workflow metrics and statistics
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '../../design-system/utils/cn';
import { Card } from '../../design-system/components/Card';
import { WorkflowStats } from '../../services/workflowStatsService';
import {
  ClockIcon,
  UserIcon,
  PlayIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';

interface WorkflowStatsCardsProps {
  stats: WorkflowStats;
  loading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  className?: string;
}

/**
 * @description Individual stat card component
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
  className
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * @description Workflow Statistics Cards Component
 */
export const WorkflowStatsCards: React.FC<WorkflowStatsCardsProps> = ({
  stats,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Workflow',
      value: stats.activeWorkflow,
      icon: PlayIcon,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      description: 'Tasks in progress'
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: PaperAirplaneIcon,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      description: 'Awaiting review'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: CheckCircleIcon,
      color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      description: 'Tasks completed'
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      description: 'Past due date'
    },
    {
      title: 'Assigned',
      value: stats.assigned,
      icon: UserIcon,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      description: 'Ready to start'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: PlayIcon,
      color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      description: 'Currently working'
    },
    {
      title: 'In Review',
      value: stats.review,
      icon: EyeIcon,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      description: 'Under review'
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: ChartBarIcon,
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      description: 'All tasks'
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Workflow Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Workflow Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.slice(0, 4).map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              description={card.description}
            />
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.slice(4).map((card, index) => (
            <StatCard
              key={index + 4}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              description={card.description}
            />
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      {(stats.dueTodayTasks > 0 || stats.dueThisWeekTasks > 0 || stats.highPriorityInWorkflow > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Priority Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.dueTodayTasks > 0 && (
              <StatCard
                title="Due Today"
                value={stats.dueTodayTasks}
                icon={ClockIcon}
                color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                description="Tasks due today"
              />
            )}
            {stats.dueThisWeekTasks > 0 && (
              <StatCard
                title="Due This Week"
                value={stats.dueThisWeekTasks}
                icon={ClockIcon}
                color="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                description="Tasks due this week"
              />
            )}
            {stats.highPriorityInWorkflow > 0 && (
              <StatCard
                title="High Priority"
                value={stats.highPriorityInWorkflow}
                icon={ExclamationTriangleIcon}
                color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                description="High priority in workflow"
              />
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                <ChartBarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg. Completion Time
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageTimeToComplete}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  From creation to done
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                <EyeIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Approval Backlog
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.approvalBacklog}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Tasks awaiting approval
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatsCards;
