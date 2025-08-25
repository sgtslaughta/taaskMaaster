/**
 * @fileoverview Task Form Component for TaaskMaaster
 * @description Comprehensive task creation and editing form with validation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Task } from './TaskList';

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
  users?: Array<{ id: string; name: string; role: string }>;
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
  attachments: [],
  subtasks: [],
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
        dueDate: task.dueDate,
        points: task.points,
        attachments: [],
        parentTaskId: task.parentTaskId,
        subtasks: task.subtasks || [],
      });
    } else {
      setFormData(defaultFormData);
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
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    if (formData.points < 0) {
      newErrors.points = 'Points cannot be negative';
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
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
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
      tags: prev.tags.filter(tag => tag !== tagToRemove),
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
      size="lg"
      title={task ? 'Edit Task' : 'Create New Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              state={errors.title ? 'error' : 'default'}
              helperText={errors.title}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Task Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Task['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To *
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.assignedTo ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select assignee</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <Input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              state={errors.dueDate ? 'error' : 'default'}
              helperText={errors.dueDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <Input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
              state={errors.points ? 'error' : 'default'}
              helperText={errors.points}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Task (Optional)
            </label>
            <select
              value={formData.parentTaskId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parentTaskId: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtasks
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              placeholder="Add a subtask"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            />
            <Button type="button" variant="outline" onClick={addSubtask}>
              Add
            </Button>
          </div>
          {formData.subtasks && formData.subtasks.length > 0 && (
            <div className="space-y-2">
              {formData.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{subtask.title}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
                    className="text-red-600 hover:text-red-800"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attachments
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.attachments && formData.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1 text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
