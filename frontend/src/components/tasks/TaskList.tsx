/**
 * @fileoverview Simple Task List Component for TaaskMaaster
 * @description Basic task list with minimal functionality
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { REWARD_TYPES } from './TaskForm';

/**
 * @description Task interface
 */
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'review' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  points: number;
  rewardType?: string;
  rewardValue?: number;
  rewardDescription?: string;
  isRecurring: boolean;
  recurrencePattern?: any;
  createdById: number;
  assignedToId?: number;
  categoryId?: number;
  templateId?: number;
  parentTaskId?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  };
  template?: {
    id: number;
    name: string;
    description?: string;
    titlePattern: string;
    descriptionTemplate?: string;
    estimatedHours?: number;
    points: number;
    priority: string;
    isPublic: boolean;
  };
  tags: {
    id: number;
    name: string;
    color?: string;
  }[];
  subtasks: Task[];
  dependencies: {
    id: number;
    dependentTaskId: number;
    dependencyType: string;
  }[];
  mediaAttachments: {
    id: number;
    filename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt?: string;
  }[];
}

/**
 * @description Task list component props
 */
export interface TaskListProps {
  /**
   * @description Tasks to display
   */
  tasks?: Task[];
  /**
   * @description Loading state
   */
  loading?: boolean;
  /**
   * @description Error state
   */
  error?: string | null;
  /**
   * @description Function to handle task creation
   */
  onCreateTask?: () => void;
  /**
   * @description Function to handle task update
   */
  onUpdateTask?: (taskId: number, updates: Partial<Task>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask?: (taskId: number) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange?: (taskId: number, status: Task['status'], actualHours?: number) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssignTask?: (taskId: number, userId: number) => void;
  /**
   * @description Function to handle task click
   */
  onTaskClick?: (task: Task) => void;
  /**
   * @description Selected tasks
   */
  selectedTasks?: Task[];
  /**
   * @description Function to handle task selection
   */
  onTaskSelect?: (task: Task, selected: boolean) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Task list component
 * @param props - Task list component props
 * @returns Task list component
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks = [],
  loading = false,
  error = null,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
  onTaskClick,
  selectedTasks = [],
  onTaskSelect,
  className,
}) => {
  const getRewardDisplay = (task: Task) => {
    if (!task.rewardType || task.rewardValue === 0) {
      return null;
    }

    const rewardType = REWARD_TYPES.find(type => type.value === task.rewardType);
    if (!rewardType) return null;

    let display = `${rewardType.icon} ${task.rewardValue}`;
    
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
        display = task.rewardDescription || 'Custom reward';
        break;
    }

    return display;
  };

  const getPriorityColor = (priority: Task['priority']) => {
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

  const isTaskSelected = (task: Task) => {
    return selectedTasks.some(selectedTask => selectedTask.id === task.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isSelected = isTaskSelected(task);
            const rewardDisplay = getRewardDisplay(task);
            
            return (
              <div 
                key={task.id} 
                className={`bg-white dark:bg-gray-800 border rounded-lg p-4 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {onTaskSelect && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onTaskSelect(task, e.target.checked);
                        }}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          task.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Category: {task.category?.name || 'Uncategorized'}</span>
                        <span>Assigned to: {task.assigned_to?.username || 'Unassigned'}</span>
                        {rewardDisplay && <span>Reward: {rewardDisplay}</span>}
                        {task.points > 0 && <span>Points: {task.points}</span>}
                        <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(
                          task.id,
                          task.status === 'completed' ? 'pending' : 'completed',
                          task.status === 'completed' ? undefined : task.actual_hours
                        );
                      }}
                      className={`px-3 py-1 text-sm rounded-md ${
                        task.status === 'completed'
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {task.status === 'completed' ? 'Undo' : 'Complete'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask?.(task.id);
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
