/**
 * @fileoverview Bulk Edit Modal Component for TaaskMaaster
 * @description Modal for bulk editing multiple tasks with common fields
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Task } from './TaskList';
import { cn } from '../../design-system/utils/cn';
import { User } from '../../services/userService';
import { REWARD_TYPES } from './TaskForm';
import { 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

/**
 * @description Bulk edit modal component props
 */
export interface BulkEditModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Selected tasks to edit
   */
  selectedTasks: Task[];
  /**
   * @description Available users for assignment
   */
  users?: User[];
  /**
   * @description Function to handle bulk update
   */
  onBulkUpdate?: (taskIds: number[], updates: Partial<Task>) => void;
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
 * @description Bulk edit form data interface
 */
interface BulkEditFormData {
  status?: Task['status'];
  priority?: Task['priority'];
  category?: string;
  assignedTo?: string;
  rewardType?: string;
  rewardValue?: number;
  rewardDescription?: string;
  dueDate?: string;
}

/**
 * @description Bulk edit modal component
 * @param props - Bulk edit modal component props
 * @returns Bulk edit modal component
 */
export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedTasks,
  users = [],
  onBulkUpdate,
  loading = false,
  className,
}) => {
  const [formData, setFormData] = useState<BulkEditFormData>({});
  const [errors, setErrors] = useState<Partial<Record<keyof BulkEditFormData, string>>>({});

  /**
   * @description Validate form data
   * @returns Whether form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BulkEditFormData, string>> = {};

    if (formData.rewardValue !== undefined && formData.rewardValue < 0) {
      newErrors.rewardValue = 'Reward value cannot be negative';
    }

    if (formData.rewardType === 'custom' && formData.rewardDescription && !formData.rewardDescription.trim()) {
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
    if (validateForm() && onBulkUpdate) {
      const updates: Partial<Task> = {};
      
      // Only include fields that have been changed
      if (formData.status !== undefined) updates.status = formData.status;
      if (formData.priority !== undefined) updates.priority = formData.priority;
      if (formData.category !== undefined) updates.category = formData.category;
      if (formData.assignedTo !== undefined) updates.assignedTo = formData.assignedTo;
      if (formData.rewardType !== undefined) updates.rewardType = formData.rewardType;
      if (formData.rewardValue !== undefined) updates.rewardValue = formData.rewardValue;
      if (formData.rewardDescription !== undefined) updates.rewardDescription = formData.rewardDescription;
      if (formData.dueDate !== undefined) updates.dueDate = formData.dueDate;

      const taskIds = selectedTasks.map(task => task.id);
      onBulkUpdate(taskIds, updates);
      onClose();
    }
  };

  /**
   * @description Reset form data
   */
  const handleReset = () => {
    setFormData({});
    setErrors({});
  };

  /**
   * @description Get unique values from selected tasks
   */
  const getUniqueValues = (field: keyof Task) => {
    const values = selectedTasks.map(task => task[field]).filter(Boolean);
    return [...new Set(values)];
  };

  /**
   * @description Check if all tasks have the same value for a field
   */
  const hasSameValue = (field: keyof Task) => {
    const values = selectedTasks.map(task => task[field]);
    return values.every(value => value === values[0]);
  };

  /**
   * @description Get display text for field values
   */
  const getFieldDisplay = (field: keyof Task) => {
    const values = getUniqueValues(field);
    if (values.length === 0) return 'Not set';
    if (values.length === 1) return String(values[0]);
    return `${values.length} different values`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Edit ${selectedTasks.length} Tasks`}
      className="dark:bg-gray-800 max-w-2xl mx-auto"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warning and Summary */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Bulk Edit Warning
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You are about to edit {selectedTasks.length} tasks. Only the fields you change will be updated.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Tasks Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Selected Tasks ({selectedTasks.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedTasks.map((task) => (
                <div key={task.id} className="text-sm text-gray-600 dark:text-gray-400">
                  • {task.title}
                </div>
              ))}
            </div>
          </div>

          {/* Current Values */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Current Values
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFieldDisplay('status')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFieldDisplay('priority')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFieldDisplay('category')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned To
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFieldDisplay('assignedTo')}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              New Values (leave blank to keep current)
            </h3>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  status: e.target.value ? e.target.value as Task['status'] : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Keep current</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  priority: e.target.value ? e.target.value as Task['priority'] : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Keep current</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  category: e.target.value || undefined 
                }))}
                placeholder="Keep current"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  assignedTo: e.target.value || undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Keep current</option>
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} {user.first_name && user.last_name ? `(${user.first_name} ${user.last_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reward Type
              </label>
              <select
                value={formData.rewardType || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  rewardType: e.target.value || undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Keep current</option>
                {REWARD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward Value */}
            {formData.rewardType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reward Value
                </label>
                <Input
                  type="number"
                  min="0"
                  step={formData.rewardType === 'monetary' ? '0.01' : '1'}
                  value={formData.rewardValue || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewardValue: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="Enter reward value"
                  className={cn(
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                    errors.rewardValue && "border-red-300 dark:border-red-500"
                  )}
                />
                {errors.rewardValue && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rewardValue}</p>
                )}
              </div>
            )}

            {/* Custom Reward Description */}
            {formData.rewardType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Reward Description
                </label>
                <Input
                  value={formData.rewardDescription || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rewardDescription: e.target.value || undefined 
                  }))}
                  placeholder="e.g., Ice cream, Movie night"
                  maxLength={255}
                  className={cn(
                    "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                    errors.rewardDescription && "border-red-300 dark:border-red-500"
                  )}
                />
                {errors.rewardDescription && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rewardDescription}</p>
                )}
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <Input
                type="datetime-local"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value || undefined 
                }))}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Reset
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {loading ? 'Updating...' : `Update ${selectedTasks.length} Tasks`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
