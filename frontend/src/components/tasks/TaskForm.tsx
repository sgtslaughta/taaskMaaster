/**
 * @fileoverview Task Form Component for TaaskMaaster
 * @description Comprehensive task creation and editing form with validation and multiple reward types
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

/**
 * @description Reward type options
 */
export const REWARD_TYPES = [
  { value: 'points', label: 'Points', description: 'Gamification points', icon: '🎯' },
  { value: 'monetary', label: 'Money', description: 'Monetary rewards', icon: '💰' },
  { value: 'time', label: 'Time', description: 'Time-based rewards', icon: '⏰' },
  { value: 'custom', label: 'Custom', description: 'Custom rewards', icon: '🎁' },
];

/**
 * @description Task form data interface
 */
export interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  category: string;
  tags: string[];
  assignedTo: string;
  dueDate: string;
  points: number;
  rewardType: string;
  rewardValue: number;
  rewardDescription: string;
  attachments?: File[];
  parentTaskId?: string;
  subtasks?: Partial<Task>[];
}

/**
 * @description Task form component props
 */
export interface TaskFormProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Function to handle form submission
   */
  onSubmit: (data: TaskFormData) => void;
  /**
   * @description Task to edit (if editing)
   */
  task?: Task;
  /**
   * @description Loading state
   */
  loading?: boolean;
  /**
   * @description Available categories
   */
  categories?: string[];
  /**
   * @description Available users for assignment
   */
  users?: User[];
  /**
   * @description Available parent tasks
   */
  parentTasks?: Task[];
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Default task form data
 */
const defaultFormData: TaskFormData = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  category: '',
  tags: [],
  assignedTo: '',
  dueDate: '',
  points: 0,
  rewardType: 'points',
  rewardValue: 0,
  rewardDescription: '',
  attachments: [],
  subtasks: [],
};

/**
 * @description Default categories if none exist in database
 */
const defaultCategories = [
  'Education',
  'Chores',
  'Activities',
  'Health',
  'Family',
  'Work',
  'Personal',
  'Shopping',
  'Entertainment',
  'Other'
];

/**
 * @description Format date for datetime-local input (sets time to 12:00 AM)
 */
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) {
    // Set default to tomorrow at 12:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  }
  
  const date = new Date(dateString);
  date.setHours(12, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

/**
 * @description Reward Type Selector component
 */
interface RewardTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  rewardValue: number;
  onRewardValueChange: (value: number) => void;
  rewardDescription: string;
  onRewardDescriptionChange: (value: string) => void;
}

const RewardTypeSelector: React.FC<RewardTypeSelectorProps> = ({
  value,
  onChange,
  rewardValue,
  onRewardValueChange,
  rewardDescription,
  onRewardDescriptionChange,
}) => {
  const selectedRewardType = REWARD_TYPES.find(type => type.value === value);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reward Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REWARD_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={cn(
                "p-3 border rounded-lg text-left transition-colors",
                value === type.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              )}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedRewardType && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {selectedRewardType.label} Amount
            </label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                step={selectedRewardType.value === 'monetary' ? '0.01' : '1'}
                value={rewardValue}
                onChange={(e) => onRewardValueChange(parseFloat(e.target.value) || 0)}
                placeholder={`Enter ${selectedRewardType.label.toLowerCase()} amount`}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-fit">
                {selectedRewardType.value === 'monetary' ? '$' : 
                 selectedRewardType.value === 'time' ? 'min' : 
                 selectedRewardType.value === 'points' ? 'pts' : ''}
              </span>
            </div>
          </div>

          {selectedRewardType.value === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Reward Description
              </label>
              <Input
                value={rewardDescription}
                onChange={(e) => onRewardDescriptionChange(e.target.value)}
                placeholder="e.g., Ice cream, Movie night, Extra screen time"
                maxLength={255}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * @description Task form component
 * @param props - Task form component props
 * @returns Task form component
 */
export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  loading = false,
  categories = [],
  users = [],
  parentTasks = [],
  className,
}) => {
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [tagInput, setTagInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');

  // Use default categories if none provided
  const availableCategories = categories.length > 0 ? categories : defaultCategories;

  // Initialize form data when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        tags: task.tags,
        assignedTo: task.assignedTo,
        dueDate: formatDateForInput(task.dueDate),
        points: task.points,
        rewardType: task.rewardType || 'points',
        rewardValue: task.rewardValue || 0,
        rewardDescription: task.rewardDescription || '',
        attachments: [],
        parentTaskId: task.parentTaskId,
        subtasks: task.subtasks || [],
      });
    } else {
      setFormData({
        ...defaultFormData,
        dueDate: formatDateForInput(), // Set default date to tomorrow at 12:00 AM
      });
    }
    setErrors({});
  }, [task, isOpen]);

  /**
   * @description Validate form data
   * @returns Whether form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Assignee is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const now = new Date();
      if (selectedDate < now) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    if (formData.points < 0) {
      newErrors.points = 'Points cannot be negative';
    }

    if (formData.rewardValue < 0) {
      newErrors.rewardValue = 'Reward value cannot be negative';
    }

    if (formData.rewardType === 'custom' && !formData.rewardDescription.trim()) {
      newErrors.rewardDescription = 'Custom reward description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * @description Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  /**
   * @description Add tag to task
   */
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  /**
   * @description Remove tag from task
   */
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  /**
   * @description Add subtask
   */
  const addSubtask = () => {
    const title = subtaskInput.trim();
    if (title) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), { title, status: 'pending' }],
      }));
      setSubtaskInput('');
    }
  };

  /**
   * @description Remove subtask
   */
  const removeSubtask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter((_, i) => i !== index),
    }));
  };

  /**
   * @description Handle file upload
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files],
    }));
  };

  /**
   * @description Remove attachment
   */
  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      className="dark:bg-gray-800 max-w-4xl mx-auto"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                  errors.title && "border-red-300 dark:border-red-500"
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={4}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  'border-gray-300 dark:border-gray-600',
                  'placeholder-gray-500 dark:placeholder-gray-400',
                  errors.description && 'border-red-300 dark:border-red-500'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Task Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
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
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  'border-gray-300 dark:border-gray-600',
                  errors.category && 'border-red-300 dark:border-red-500'
                )}
              >
                <option value="">Select category</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className={cn(
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  'border-gray-300 dark:border-gray-600',
                  errors.assignedTo && 'border-red-300 dark:border-red-500'
                )}
              >
                <option value="">
                  {users.length > 0 ? 'Select assignee' : 'No users available'}
                </option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} {user.first_name && user.last_name ? `(${user.first_name} ${user.last_name})` : ''}
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  Unable to load users. You may not have permission to view the user list.
                </p>
              )}
              {errors.assignedTo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignedTo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <Input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                  errors.dueDate && "border-red-300 dark:border-red-500"
                )}
              />
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points
              </label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                className={cn(
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                  errors.points && "border-red-300 dark:border-red-500"
                )}
              />
              {errors.points && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.points}</p>
              )}
            </div>
          </div>

          {/* Reward Type and Value */}
          <RewardTypeSelector
            value={formData.rewardType}
            onChange={(value) => setFormData(prev => ({ ...prev, rewardType: value }))}
            rewardValue={formData.rewardValue}
            onRewardValueChange={(value) => setFormData(prev => ({ ...prev, rewardValue: value }))}
            rewardDescription={formData.rewardDescription}
            onRewardDescriptionChange={(value) => setFormData(prev => ({ ...prev, rewardDescription: value }))}
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button 
                type="button" 
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Parent Task */}
          {parentTasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parent Task (Optional)
              </label>
              <select
                value={formData.parentTaskId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, parentTaskId: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">No parent task</option>
                {parentTasks.map(parentTask => (
                  <option key={parentTask.id} value={parentTask.id}>{parentTask.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtasks
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Add a subtask"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button 
                type="button" 
                onClick={addSubtask}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                Add
              </Button>
            </div>
            {formData.subtasks && formData.subtasks.length > 0 && (
              <div className="space-y-2">
                {formData.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{subtask.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
            />
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
