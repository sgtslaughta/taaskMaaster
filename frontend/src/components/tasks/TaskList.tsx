/**
 * @fileoverview Simple Task List Component for TaaskMaaster
 * @description Basic task list with minimal functionality
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';

/**
 * @description Task interface
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  tags: string[];
  assignedTo: string;
  dueDate: string;
  points: number;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  parentTaskId?: string;
  subtasks?: Task[];
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
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask?: (taskId: string) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssignTask?: (taskId: string, userId: string) => void;
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
  className,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <button
          onClick={onCreateTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Category: {task.category}</span>
                    <span>Assigned to: {task.assignedTo}</span>
                    <span>Points: {task.points}</span>
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onStatusChange?.(task.id, 'completed')}
                    disabled={task.status === 'completed'}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => onUpdateTask?.(task.id, {})}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteTask?.(task.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
