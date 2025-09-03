/**
 * @fileoverview Task Activity Timeline Component for TaaskMaaster
 * @description Displays task status changes, edits, and other activity events
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import { taskHistoryService, TaskStatusHistory, TaskHistoryUser } from '../../services/taskHistoryService';
import {
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TaskActivityTimelineProps {
  taskId: number;
  currentUser?: TaskHistoryUser;
  className?: string;
}

/**
 * @description Task Activity Timeline Component
 */
const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({
  taskId,
  currentUser,
  className
}) => {
  const [history, setHistory] = useState<TaskStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaskHistory = async () => {
      if (!currentUser) {
        setError('User authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await taskHistoryService.getTaskHistory(taskId, currentUser);
        setHistory(response.history);
      } catch (err) {
        console.error('Error loading task history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load task history');
      } finally {
        setLoading(false);
      }
    };

    if (taskId && currentUser) {
      loadTaskHistory();
    } else if (taskId && !currentUser) {
      setError('User authentication required');
      setLoading(false);
    }
  }, [taskId, currentUser]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Loading activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="flex items-center space-x-2 text-red-500">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500 dark:text-gray-400", className)}>
        <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity history available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {history.map((event, index) => (
        <div key={event.id} className="relative flex items-start space-x-3 pb-4 last:pb-0">
          {/* Timeline Line */}
          {index < history.length - 1 && (
            <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200 dark:bg-gray-600" />
          )}
          
          {/* Status Icon */}
          <div className="relative flex-shrink-0 mt-1 z-10">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-white dark:border-gray-800">
              <span className="text-xs">
                {taskHistoryService.getStatusChangeIcon(event.previous_status, event.new_status)}
              </span>
            </div>
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-3 h-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {event.user.username}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {taskHistoryService.getStatusChangeDescription(event.previous_status, event.new_status)}
            </p>

            {event.comment && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Comment:</span> {event.comment}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskActivityTimeline;
