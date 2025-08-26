/**
 * @fileoverview Task Detail Modal Component for TaaskMaaster
 * @description Enhanced task detail modal with inline editing capabilities
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Task } from './TaskList';
import { cn } from '../../design-system/utils/cn';
import { User } from '../../services/userService';
import { REWARD_TYPES } from './TaskForm';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

/**
 * @description Task detail modal component props
 */
export interface TaskDetailModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Task to display
   */
  task?: Task;
  /**
   * @description Available users for assignment
   */
  users?: User[];
  /**
   * @description Function to handle task update
   */
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask?: (taskId: string) => void;
  /**
   * @description Function to handle task completion
   */
  onCompleteTask?: (taskId: string) => void;
  /**
   * @description Loading state
   */
  loading?: boolean;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Editable field component
 */
interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  type?: 'text' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  type = 'text',
  options = [],
  className
}) => {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
  };

  const handleCancel = () => {
    setEditValue(value);
    onCancel();
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        ) : type === 'select' ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            <CheckIcon className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-1 text-sm text-gray-900 dark:text-white">
        {value || 'Not set'}
      </div>
    </div>
  );
};

/**
 * @description Task detail modal component
 * @param props - Task detail modal component props
 * @returns Task detail modal component
 */
export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  users = [],
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  loading = false,
  className,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  if (!task) {
    return null;
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
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

  const getRewardDisplay = () => {
    if (!task.rewardType || task.rewardValue === 0) {
      return 'No reward';
    }

    const rewardType = REWARD_TYPES.find(type => type.value === task.rewardType);
    if (!rewardType) return 'No reward';

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

  const handleFieldUpdate = (field: string, value: string) => {
    if (onUpdateTask) {
      onUpdateTask(task.id, { [field]: value });
    }
    setEditingField(null);
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (onUpdateTask) {
      onUpdateTask(task.id, { status: newStatus });
    }
  };

  const handleComplete = () => {
    if (onCompleteTask) {
      onCompleteTask(task.id);
    }
  };

  const handleDelete = () => {
    if (onDeleteTask && confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      className="dark:bg-gray-800 max-w-4xl mx-auto"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Header with Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(task.status)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {task.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {task.status !== 'completed' && (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                getPriorityColor(task.priority)
              )}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
          </div>

          {/* Description */}
          <EditableField
            label="Description"
            value={task.description}
            isEditing={editingField === 'description'}
            onEdit={() => setEditingField('description')}
            onSave={(value) => handleFieldUpdate('description', value)}
            onCancel={() => setEditingField(null)}
            type="textarea"
          />

          {/* Category and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              label="Category"
              value={task.category}
              isEditing={editingField === 'category'}
              onEdit={() => setEditingField('category')}
              onSave={(value) => handleFieldUpdate('category', value)}
              onCancel={() => setEditingField(null)}
              type="text"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.assignedTo || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date and Reward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reward
              </label>
              <div className="text-sm text-gray-900 dark:text-white">
                {getRewardDisplay()}
              </div>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtasks
              </label>
              <div className="space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input
                      type="checkbox"
                      checked={subtask.status === 'completed'}
                      onChange={() => {
                        // Handle subtask status change
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      subtask.status === 'completed' 
                        ? "text-gray-500 line-through" 
                        : "text-gray-900 dark:text-white"
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Task created on {new Date(task.createdAt).toLocaleString()}</span>
              </div>
              {task.updatedAt !== task.createdAt && (
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>Last updated on {new Date(task.updatedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
