/**
 * @fileoverview Tasks Tab Component for TaaskMaaster
 * @description Task management tab with advanced filtering and organization (Phase 2)
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { TaskList, Task as FrontendTask } from '../../tasks';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';

/**
 * @description Tasks tab component props
 */
export interface TasksTabProps {
  /**
   * @description Tasks to display
   */
  tasks: FrontendTask[];
  /**
   * @description Loading state
   */
  loading: boolean;
  /**
   * @description Error state
   */
  error: string | null;
  /**
   * @description Function to handle task creation
   */
  onCreateTask: () => void;
  /**
   * @description Function to handle task update
   */
  onUpdateTask: (taskId: string, updates: Partial<FrontendTask>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask: (taskId: string) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange: (taskId: string, status: FrontendTask['status']) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssignTask: (taskId: string, userId: string) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Tasks tab component
 * @param props - Tasks tab component props
 * @returns Tasks tab component
 */
export const TasksTab: React.FC<TasksTabProps> = ({ 
  tasks,
  loading,
  error,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
  className 
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <div className="p-8 text-center">
          <div className="mb-4">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Task Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Advanced task creation, editing, and management with search, filtering, and sorting capabilities.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Coming in Phase 2:</strong> Search, filtering, sorting, compact/expanded views, 
              multiple reward types, and enhanced task management features.
            </p>
          </div>
        </div>
      </Card>

      {/* Task Management Actions */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Management</h3>
            <Button onClick={onCreateTask} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Task
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create, edit, and manage your tasks with advanced filtering and organization capabilities.
          </p>
        </div>
      </Card>

      {/* Task List */}
      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onAssignTask={onAssignTask}
        className={className}
      />

      {/* Placeholder for future content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Search & Filters</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Advanced search functionality</p>
              <p>• Filter by status, priority, category</p>
              <p>• Date range filtering</p>
              <p>• Reward type filtering</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">View Options</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Compact view (default)</p>
              <p>• Expanded view with details</p>
              <p>• Sortable columns</p>
              <p>• Pagination support</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Task Details</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Inline editing capabilities</p>
              <p>• Subtask management</p>
              <p>• Attachment handling</p>
              <p>• Real-time updates</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Reward Types</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Monetary rewards ($)</p>
              <p>• Point-based rewards (pts)</p>
              <p>• Time-based rewards (min/hrs)</p>
              <p>• Custom reward types</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
