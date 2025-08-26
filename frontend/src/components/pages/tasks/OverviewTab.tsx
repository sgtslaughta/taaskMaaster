/**
 * @fileoverview Overview Tab Component for TaaskMaaster
 * @description Overview tab with task statistics, recent activity, and quick actions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
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
  const [activeMetricTab, setActiveMetricTab] = useState<string>('overview');
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
    
    // Calculate average completion time from completed tasks
    const completedTasks = tasks.filter(t => t.status === 'completed');
    let averageCompletionTime = 'N/A';
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt); // Use updatedAt for completion time
        const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      const avgDays = totalDays / completedTasks.length;
      averageCompletionTime = avgDays < 1 ? '< 1 day' : `${avgDays.toFixed(1)} days`;
    }
    
    return {
      completionRate,
      totalPoints,
      averageCompletionTime,
    };
  };

  /**
   * @description Get weekly progress data with better date handling
   */
  const getWeeklyProgress = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    // Get the start of the current week (Monday)
    const weekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so subtract 6 to get to Monday
    weekStart.setDate(today.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0); // Start of day
    
    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      
      // Use a more flexible date comparison
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        const taskDateStr = taskDate.toDateString();
        const targetDateStr = date.toDateString();
        return taskDateStr === targetDateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.status === 'completed');
      const completionRate = dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0;
      
      return {
        day,
        value: Math.round(completionRate),
        total: dayTasks.length,
        completed: completedTasks.length
      };
    });
  };

  /**
   * @description Get category breakdown
   */
  const getCategoryBreakdown = () => {
    const categoryMap = new Map<string, number>();
    
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const total = tasks.length;
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  };

  /**
   * @description Get priority distribution
   */
  const getPriorityDistribution = () => {
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;
    
    return { highPriority, mediumPriority, lowPriority };
  };

  const stats = getTaskStats();
  const recentActivity = getRecentActivity();
  const performance = getPerformanceMetrics();
  const weeklyProgress = getWeeklyProgress();
  const categoryBreakdown = getCategoryBreakdown();
  const priorityDistribution = getPriorityDistribution();

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
           
           {/* Metric Tabs */}
           <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
             <button
               onClick={() => setActiveMetricTab('overview')}
               className={cn(
                 'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                 activeMetricTab === 'overview'
                   ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                   : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
               )}
             >
               Overview
             </button>
             <button
               onClick={() => setActiveMetricTab('trends')}
               className={cn(
                 'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                 activeMetricTab === 'trends'
                   ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                   : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
               )}
             >
               Trends
             </button>
             <button
               onClick={() => setActiveMetricTab('breakdown')}
               className={cn(
                 'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                 activeMetricTab === 'breakdown'
                   ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                   : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
               )}
             >
               Breakdown
             </button>
           </div>

           {/* Tab Content */}
           {activeMetricTab === 'overview' && (
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
           )}

           {activeMetricTab === 'trends' && (
             <div className="space-y-4">
               {/* Weekly Progress Chart */}
               <div>
                 <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Weekly Progress</h4>
                 <div className="flex items-end space-x-1 h-24">
                   {weeklyProgress.map((day, index) => (
                     <div key={index} className="flex-1 flex flex-col items-center">
                       <div 
                         className={cn(
                           "w-full rounded-t transition-all duration-300",
                           day.total > 0 
                             ? "bg-blue-200 dark:bg-blue-700" 
                             : "bg-gray-200 dark:bg-gray-600"
                         )}
                         style={{ height: `${Math.max(day.value, 5)}%` }}
                       />
                       <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                         {day.day}
                       </span>
                       <span className="text-xs text-gray-400 dark:text-gray-500">
                         {day.completed}/{day.total}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Weekly Summary */}
               <div>
                 <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">This Week Summary</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                     <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                       {weeklyProgress.reduce((sum, day) => sum + day.completed, 0)}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Completed</p>
                   </div>
                   <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                     <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                       {weeklyProgress.reduce((sum, day) => sum + day.total, 0)}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeMetricTab === 'breakdown' && (
             <div className="space-y-4">
               {/* Category Breakdown */}
               <div>
                 <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tasks by Category</h4>
                 <div className="space-y-2">
                   {categoryBreakdown.length > 0 ? (
                     categoryBreakdown.map((item, index) => (
                       <div key={index} className="flex items-center space-x-3">
                         <div className="w-3 h-3 rounded-full bg-blue-500" />
                         <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.category}</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                         <span className="text-sm text-gray-500 dark:text-gray-400">{item.percentage}%</span>
                       </div>
                     ))
                   ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No tasks with categories</p>
                   )}
                 </div>
               </div>

               {/* Priority Distribution */}
               <div>
                 <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Priority Distribution</h4>
                 <div className="grid grid-cols-3 gap-4">
                   <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                     <p className="text-lg font-semibold text-red-600 dark:text-red-400">{priorityDistribution.highPriority}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">High Priority</p>
                   </div>
                   <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                     <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{priorityDistribution.mediumPriority}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Medium Priority</p>
                   </div>
                   <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                     <p className="text-lg font-semibold text-green-600 dark:text-green-400">{priorityDistribution.lowPriority}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Low Priority</p>
                   </div>
                 </div>
               </div>
             </div>
           )}
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
