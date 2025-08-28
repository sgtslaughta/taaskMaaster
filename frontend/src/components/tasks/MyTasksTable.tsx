/**
 * @fileoverview My Tasks Table Component for TaaskMaaster
 * @description Read-only table component for displaying user's assigned tasks
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '../../design-system/utils/cn';
import { WorkflowStatusBadge, type WorkflowStatus } from '../workflow/WorkflowStatusBadge';
import { FrontendTask } from '../../services/taskService';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

/**
 * @description My Tasks Table component props
 */
export interface MyTasksTableProps {
  /** List of tasks to display */
  tasks: FrontendTask[];
  /** Whether the table is in a loading state */
  loading?: boolean;
  /** Callback when task is clicked */
  onTaskClick?: (task: FrontendTask) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Get status icon for task
 */
const getStatusIcon = (status: FrontendTask['status']) => {
  switch (status) {
    case 'done':
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    case 'in_progress':
      return <PlayIcon className="w-4 h-4 text-blue-500" />;
    case 'cancelled':
      return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
    default:
      return <ClockIcon className="w-4 h-4 text-gray-500" />;
  }
};

/**
 * @description Get priority color classes
 */
const getPriorityColor = (priority: FrontendTask['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    case 'high':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'low':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * @description Format date for display
 */
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * @description Get reward display string
 */
const getRewardDisplay = (task: FrontendTask) => {
  if (!task.rewardType || task.rewardValue === 0) {
    return '-';
  }

  let display = `${task.rewardValue}`;
  
  switch (task.rewardType) {
    case 'monetary':
      display += ' USD';
      break;
    case 'time':
      display += ' min';
      break;
    case 'points':
      display += ' pts';
      break;
    case 'custom':
      display = task.rewardDescription || 'Custom';
      break;
  }

  return display;
};

/**
 * @description My Tasks Table Component
 */
const MyTasksTable: React.FC<MyTasksTableProps> = ({
  tasks,
  loading = false,
  onTaskClick,
  className,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tasks...</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-medium mb-2">No tasks assigned</h3>
        <p>You don't have any tasks assigned to you yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reward
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onTaskClick?.(task)}
              >
                {/* Task Column */}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {task.category?.name || 'Uncategorized'}
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center mt-1">
                        <TagIcon className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {task.tags.slice(0, 2).join(', ')}
                          {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <WorkflowStatusBadge 
                    status={task.status as WorkflowStatus} 
                    compact={true}
                  />
                </td>

                {/* Priority Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                    getPriorityColor(task.priority)
                  )}>
                    {task.priority}
                  </span>
                </td>

                {/* Due Date Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900 dark:text-white">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                    {formatDate(task.dueDate)}
                  </div>
                </td>

                {/* Points Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900 dark:text-white">
                    <TrophyIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    {task.points || 0}
                  </div>
                </td>

                {/* Reward Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getRewardDisplay(task)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => onTaskClick?.(task)}
          >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                  {task.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {task.category?.name || 'Uncategorized'}
                </p>
              </div>
              <div className="flex items-center ml-2">
                {getStatusIcon(task.status)}
              </div>
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-1">Priority:</span>
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                  getPriorityColor(task.priority)
                )}>
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-gray-900 dark:text-white">{formatDate(task.dueDate)}</span>
              </div>
              <div className="flex items-center">
                <TrophyIcon className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-gray-900 dark:text-white">{task.points || 0} pts</span>
              </div>
              <div className="text-gray-900 dark:text-white">
                {getRewardDisplay(task)}
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center mt-2">
                <TagIcon className="w-3 h-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {task.tags.slice(0, 3).join(', ')}
                  {task.tags.length > 3 && ` +${task.tags.length - 3}`}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyTasksTable;
