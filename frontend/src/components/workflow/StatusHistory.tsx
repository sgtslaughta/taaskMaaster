/**
 * @fileoverview Status History component for TaaskMaaster
 * @description Timeline component for displaying task status change history
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { TaskStatusHistory, TaskStatusHistoryListResponse } from '../../services/commentService';
import { WorkflowService } from '../../services/workflowService';

/**
 * @description Status history props interface
 */
interface StatusHistoryProps {
  taskId: number;
  className?: string;
  showTitle?: boolean;
  maxItems?: number;
}

/**
 * @description Status History Component
 * @param props - Component props
 * @returns JSX.Element
 */
export const StatusHistory: React.FC<StatusHistoryProps> = ({
  taskId,
  className,
  showTitle = true,
  maxItems = 10,
}) => {
  const [history, setHistory] = useState<TaskStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  /**
   * Load status history
   */
  const loadStatusHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: TaskStatusHistoryListResponse = await WorkflowService.getTaskStatusHistory(
        taskId,
        0,
        showAll ? 100 : maxItems
      );
      setHistory(response.history);
    } catch (err: any) {
      console.error('Error loading status history:', err);
      setError(err.response?.data?.detail || 'Failed to load status history');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    let relativeTime: string;
    if (diffInMinutes < 1) {
      relativeTime = 'just now';
    } else if (diffInMinutes < 60) {
      relativeTime = `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      relativeTime = `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      relativeTime = `${diffInDays}d ago`;
    } else {
      relativeTime = date.toLocaleDateString();
    }

    return `${relativeTime} (${date.toLocaleDateString()} ${date.toLocaleTimeString()})`;
  };

  /**
   * Get status display name
   */
  const getStatusDisplayName = (status: string): string => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'submitted_for_approval':
        return 'Submitted for Approval';
      case 'review':
        return 'Review';
      case 'done':
        return 'Done';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'todo':
        return 'gray';
      case 'assigned':
        return 'blue';
      case 'in_progress':
        return 'yellow';
      case 'submitted_for_approval':
        return 'purple';
      case 'review':
        return 'orange';
      case 'done':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'todo':
        return '📋';
      case 'assigned':
        return '👤';
      case 'in_progress':
        return '⚡';
      case 'submitted_for_approval':
        return '⏳';
      case 'review':
        return '👁️';
      case 'done':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '🔄';
    }
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (historyItem: TaskStatusHistory): string => {
    if (!historyItem.user) return 'Unknown User';
    
    const { first_name, last_name, username } = historyItem.user;
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    } else if (first_name) {
      return first_name;
    } else {
      return username;
    }
  };

  /**
   * Load history on mount
   */
  useEffect(() => {
    loadStatusHistory();
  }, [taskId, showAll]);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-900">Status History</h4>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-2', className)}>
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-900">Status History</h4>
        )}
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-900">Status History</h4>
        )}
        <div className="text-sm text-gray-500">No status changes yet</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">
            Status History ({history.length})
          </h4>
          {history.length > maxItems && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600"
            >
              Show all
            </Button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {history.map((item, index) => (
          <div key={item.id} className="flex gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                  `bg-${getStatusColor(item.new_status)}-100`,
                  `text-${getStatusColor(item.new_status)}-700`,
                  'border-2 border-white shadow-sm'
                )}
              >
                {getStatusIcon(item.new_status)}
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-6 bg-gray-200 mt-2"></div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName(item)}
                    </span>
                    <span className="text-sm text-gray-600">
                      changed status
                    </span>
                    {item.previous_status && (
                      <>
                        <span className="text-sm text-gray-400">from</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            `bg-${getStatusColor(item.previous_status)}-100`,
                            `text-${getStatusColor(item.previous_status)}-800`
                          )}
                        >
                          {getStatusDisplayName(item.previous_status)}
                        </span>
                      </>
                    )}
                    <span className="text-sm text-gray-400">to</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        `bg-${getStatusColor(item.new_status)}-100`,
                        `text-${getStatusColor(item.new_status)}-800`
                      )}
                    >
                      {getStatusDisplayName(item.new_status)}
                    </span>
                  </div>
                  
                  {item.comment && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                      {item.comment}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {formatTimestamp(item.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAll && history.length > maxItems && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(false)}
            className="text-xs text-gray-600"
          >
            Show less
          </Button>
        </div>
      )}
    </div>
  );
};
