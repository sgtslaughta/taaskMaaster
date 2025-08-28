/**
 * @fileoverview Create Template Modal Component for TaaskMaaster
 * @description Modal component for creating and editing task templates
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { TaskTemplate } from './TemplateCard';
import { cn } from '../../design-system/utils/cn';
import { 
  XMarkIcon,
  InformationCircleIcon,
  TagIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

/**
 * @description Template form data interface
 */
export interface TemplateFormData {
  name: string;
  description: string;
  title_pattern: string;
  description_template: string;
  estimated_hours: number;
  points: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: number;
  tags: string[];
  is_public: boolean;
}

/**
 * @description Create template modal component props
 */
export interface CreateTemplateModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Template to edit (if editing)
   */
  template?: TaskTemplate;
  /**
   * @description Available categories for selection
   */
  categories?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  /**
   * @description Whether the modal is in a loading state
   */
  loading?: boolean;
  /**
   * @description Callback when modal is closed
   */
  onClose: () => void;
  /**
   * @description Callback when template is saved
   */
  onSave: (data: TemplateFormData) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Default template form data
 */
const defaultFormData: TemplateFormData = {
  name: '',
  description: '',
  title_pattern: '',
  description_template: '',
  estimated_hours: 0,
  points: 0,
  priority: 'medium',
  category_id: undefined,
  tags: [],
  is_public: false,
};

/**
 * @description Create template modal component
 * @param props - Create template modal component props
 * @returns Create template modal component
 */
export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  template,
  categories = [],
  loading = false,
  onClose,
  onSave,
  className
}) => {
  const [formData, setFormData] = useState<TemplateFormData>(defaultFormData);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when template is provided (edit mode)
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        title_pattern: template.title_pattern,
        description_template: template.description_template || '',
        estimated_hours: template.estimated_hours,
        points: template.points,
        priority: template.priority,
        category_id: template.category_id,
        tags: template.tags || [],
        is_public: template.is_public,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [template, isOpen]);

  /**
   * @description Validate form data
   * @returns Whether the form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.title_pattern.trim()) {
      newErrors.title_pattern = 'Title pattern is required';
    }

    if (formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Estimated hours cannot be negative';
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
      onSave(formData);
    }
  };

  /**
   * @description Add a new tag
   */
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  /**
   * @description Remove a tag
   * @param tagToRemove - Tag to remove
   */
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * @description Handle tag input key press
   * @param e - Keyboard event
   */
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Template' : 'Create Template'}
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      className={cn('max-w-2xl', className)}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Basic Information
          </h3>

          {/* Template Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Daily Chore Template"
              error={errors.name}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this template is for..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Template Patterns */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Template Patterns</h3>

          {/* Title Pattern */}
          <div>
            <label htmlFor="title_pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title Pattern *
            </label>
            <Input
              id="title_pattern"
              type="text"
              value={formData.title_pattern}
              onChange={(e) => setFormData(prev => ({ ...prev, title_pattern: e.target.value }))}
              placeholder="e.g., Clean {room} or Complete {subject} homework"
              error={errors.title_pattern}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use {'{variable}'} for dynamic content that users can customize
            </p>
          </div>

          {/* Description Template */}
          <div>
            <label htmlFor="description_template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description Template
            </label>
            <textarea
              id="description_template"
              value={formData.description_template}
              onChange={(e) => setFormData(prev => ({ ...prev, description_template: e.target.value }))}
              placeholder="Template for task description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Task Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Task Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Hours */}
            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Hours
              </label>
              <div className="relative">
                <Input
                  id="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  error={errors.estimated_hours}
                />
                <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Points */}
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Points
              </label>
              <div className="relative">
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  error={errors.points}
                />
                <StarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formData.category_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <TagIcon className="h-5 w-5 mr-2" />
            Tags
          </h3>

          <div>
            <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Tags
            </label>
            <div className="flex gap-2">
              <Input
                id="tagInput"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Enter tag and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tags Display */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Visibility</h3>

          <div className="flex items-center">
            <input
              id="is_public"
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this template public (visible to all users)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            loading={loading}
          >
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
