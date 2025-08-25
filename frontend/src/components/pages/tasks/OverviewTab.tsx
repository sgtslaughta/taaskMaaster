/**
 * @fileoverview Overview Tab Component for TaaskMaaster
 * @description Overview tab with task statistics, recent activity, and quick actions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { TaskList, Task as FrontendTask } from '../../tasks';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';

/**
 * @description Overview tab component props
 */
export interface OverviewTabProps {
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
   * @description Function to refresh tasks
   */
  onRefresh: () => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Overview tab component
 * @param props - Overview tab component props
 * @returns Overview tab component
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  tasks,
  loading,
  error,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
  onRefresh,
  className,
}) => {
  /**
   * @description Get task statistics
   */
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    return { total, completed, inProgress, overdue };
  };

  /**
   * @description Get recent activity
   */
  const getRecentActivity = () => {
    return tasks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  };

  /**
   * @description Get performance metrics
   */
  const getPerformanceMetrics = () => {
    const stats = getTaskStats();
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const totalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0);
    
    return {
      completionRate,
      totalPoints,
      averageCompletionTime: '2.3 days', // Placeholder - would be calculated from actual data
    };
  };

  const stats = getTaskStats();
  const recentActivity = getRecentActivity();
  const performance = getPerformanceMetrics();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-sm font-medium">⏰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {task.status === 'completed' ? '✅' : task.status === 'in_progress' ? '🔄' : '📝'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in progress' : 'created'} • {new Date(task.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {task.assignedTo || 'Unassigned'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{performance.completionRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{performance.averageCompletionTime}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Completion Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{performance.totalPoints}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Points Earned</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateTask} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Task
            </Button>
            <Button onClick={onRefresh} disabled={loading} className="bg-gray-600 hover:bg-gray-700 text-white">
              Refresh
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Generate Report
            </Button>
          </div>
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
    </div>
  );
};
