/**
 * @fileoverview Task Card Component for TaaskMaaster
 * @description Individual task card with status management and interactive elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Task } from './TaskList';

/**
 * @description Task card component props
 */
export interface TaskCardProps {
  /**
   * @description Task data
   */
  task: Task;
  /**
   * @description Function to handle task update
   */
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDelete?: (taskId: string) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssign?: (taskId: string, userId: string) => void;
  /**
   * @description View mode for the card
   */
  viewMode?: 'list' | 'grid' | 'kanban';
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Get priority color
 * @param priority - Task priority
 * @returns Color class
 */
const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * @description Get status color
 * @param status - Task status
 * @returns Color class
 */
const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * @description Get status icon
 * @param status - Task status
 * @returns Status icon
 */
const getStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🔄';
    case 'overdue':
      return '⏰';
    case 'pending':
    default:
      return '⏳';
  }
};

/**
 * @description Format date
 * @param dateString - Date string
 * @returns Formatted date
 */
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * @description Task card component
 * @param props - Task card component props
 * @returns Task card component
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onStatusChange,
  onAssign,
  viewMode = 'list',
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card
      className={`${className} ${isOverdue ? 'border-red-300 bg-red-50' : ''} transition-all duration-200 hover:shadow-md`}
      variant={viewMode === 'grid' ? 'elevated' : 'default'}
    >
      <Card.CardBody className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)} {task.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              {task.points > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⭐ {task.points} pts
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '−' : '+'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              ✏️
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-red-600 hover:text-red-700"
              >
                🗑️
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {isExpanded && (
          <div className="mb-3">
            <p className="text-gray-600 text-sm leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Category: {task.category?.name || 'Uncategorized'}</span>
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Assigned to: {task.assignedTo?.username || 'Unassigned'}</span>
            <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">📎 Attachments:</span>
              <span className="text-sm text-gray-600">{task.attachments.length}</span>
            </div>
          </div>
        )}

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">📋 Subtasks:</span>
              <span className="text-sm text-gray-600">
                {task.subtasks.filter(st => st.status === 'completed').length} / {task.subtasks.length}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {task.subtasks.slice(0, 3).map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2 text-xs">
                  <span className={subtask.status === 'completed' ? 'text-green-600' : 'text-gray-400'}>
                    {subtask.status === 'completed' ? '✅' : '⭕'}
                  </span>
                  <span className={`truncate ${subtask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{task.subtasks.length - 3} more subtasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onStatusChange && task.status !== 'completed' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onStatusChange(task.id, 'completed')}
                >
                  Mark Complete
                </Button>
              )}
              {onStatusChange && task.status === 'pending' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onStatusChange(task.id, 'in_progress')}
                >
                  Start Task
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card.CardBody>
    </Card>
  );
};
