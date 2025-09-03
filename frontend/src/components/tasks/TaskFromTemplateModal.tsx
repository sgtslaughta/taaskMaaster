/**
 * @fileoverview Task From Template Modal Component
 * @description Modal for customizing task values when creating from a template
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TaskTemplate } from './TemplateCard';
import { User } from '../auth/LoginPage';

/**
 * @description Task creation form data interface
 */
export interface TaskFromTemplateFormData {
  title: string;
  description: string;
  assigned_to_id?: number;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours?: number;
  points?: number;
}

/**
 * @description Task from template modal props
 */
export interface TaskFromTemplateModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * @description Template to create task from
   */
  template: TaskTemplate | null;
  
  /**
   * @description Available users for assignment
   */
  users?: User[];
  
  /**
   * @description Loading state
   */
  loading?: boolean;
  
  /**
   * @description Close modal callback
   */
  onClose: () => void;
  
  /**
   * @description Create task callback
   * @param templateId - Template ID
   * @param formData - Customized task data
   */
  onCreate: (templateId: number, formData: TaskFromTemplateFormData) => Promise<void>;
  
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Task from template modal component
 * @param props - Task from template modal component props
 * @returns Task from template modal component
 */
export const TaskFromTemplateModal: React.FC<TaskFromTemplateModalProps> = ({
  isOpen,
  template,
  users = [],
  loading = false,
  onClose,
  onCreate,
  className = ''
}) => {
  const [formData, setFormData] = useState<TaskFromTemplateFormData>({
    title: '',
    description: '',
    assigned_to_id: undefined,
    due_date: undefined,
    priority: 'medium',
    estimated_hours: undefined,
    points: undefined,
  });

  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * @description Extract variables from template strings
   * @param text - Text containing variables in {variable} format
   * @returns Array of unique variable names
   */
  const extractVariables = (text: string): string[] => {
    const matches = text.match(/{([^}]+)}/g);
    if (!matches) return [];
    
    const variables = matches.map(match => match.slice(1, -1)); // Remove { and }
    return [...new Set(variables)]; // Remove duplicates
  };

  /**
   * @description Replace variables in text with values
   * @param text - Text containing variables in {variable} format
   * @param variables - Object mapping variable names to values
   * @returns Text with variables replaced
   */
  const replaceVariables = (text: string, variables: Record<string, string>): string => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value || `{${key}}`);
    });
    return result;
  };

  /**
   * @description Convert variable name to display label
   * @param variableName - Variable name (e.g., "meeting_type")
   * @returns Display label (e.g., "Meeting Type")
   */
  const variableToLabel = (variableName: string): string => {
    return variableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * @description Initialize form data and template variables when template changes
   */
  useEffect(() => {
    if (template && isOpen) {
      // Extract variables from template
      const titleVariables = extractVariables(template.title_pattern || '');
      const descriptionVariables = extractVariables(template.description_template || '');
      const allVariables = [...new Set([...titleVariables, ...descriptionVariables])];
      
      // Initialize template variables with empty values
      const initialVariables: Record<string, string> = {};
      allVariables.forEach(variable => {
        initialVariables[variable] = '';
      });
      
      setTemplateVariables(initialVariables);
      setFormData({
        title: template.title_pattern || '',
        description: template.description_template || '',
        assigned_to_id: undefined,
        due_date: undefined,
        priority: template.priority || 'medium',
        estimated_hours: template.estimated_hours || undefined,
        points: template.points || undefined,
      });
      setErrors({});
    }
  }, [template, isOpen]);

  /**
   * @description Handle form field changes
   * @param field - Field name
   * @param value - Field value
   */
  const handleFieldChange = (field: keyof TaskFromTemplateFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * @description Handle template variable changes
   * @param variableName - Variable name
   * @param value - Variable value
   */
  const handleVariableChange = (variableName: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
    
    // Clear error for this variable
    if (errors[`variable_${variableName}`]) {
      setErrors(prev => ({
        ...prev,
        [`variable_${variableName}`]: ''
      }));
    }
  };

  /**
   * @description Validate form data
   * @returns Whether the form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate template variables
    Object.keys(templateVariables).forEach(variableName => {
      if (!templateVariables[variableName].trim()) {
        newErrors[`variable_${variableName}`] = `${variableToLabel(variableName)} is required`;
      }
    });

    // Generate final title and description with variables replaced
    const finalTitle = replaceVariables(formData.title, templateVariables);
    const finalDescription = replaceVariables(formData.description, templateVariables);

    if (!finalTitle.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!finalDescription.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.estimated_hours !== undefined && formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Estimated hours cannot be negative';
    }

    if (formData.points !== undefined && formData.points < 0) {
      newErrors.points = 'Points cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * @description Handle form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template || !validateForm()) {
      return;
    }

    try {
      // Replace variables in title and description
      const finalTitle = replaceVariables(formData.title, templateVariables);
      const finalDescription = replaceVariables(formData.description, templateVariables);
      
      // Create form data with replaced values
      const submissionData: TaskFromTemplateFormData = {
        ...formData,
        title: finalTitle,
        description: finalDescription,
      };
      
      await onCreate(template.id, submissionData);
      onClose();
    } catch (error) {
      console.error('Failed to create task from template:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    }
  };

  /**
   * @description Handle modal close
   */
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to_id: undefined,
      due_date: undefined,
      priority: 'medium',
      estimated_hours: undefined,
      points: undefined,
    });
    setTemplateVariables({});
    setErrors({});
    onClose();
  };

  if (!isOpen || !template) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Task from Template
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Template: {template.name}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Enter task description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Template Variables */}
            {Object.keys(templateVariables).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Template Variables
                </h4>
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  {Object.keys(templateVariables).map((variableName) => (
                    <div key={variableName}>
                      <label 
                        htmlFor={`variable_${variableName}`} 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        {variableToLabel(variableName)} *
                      </label>
                      <input
                        type="text"
                        id={`variable_${variableName}`}
                        value={templateVariables[variableName]}
                        onChange={(e) => handleVariableChange(variableName, e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors[`variable_${variableName}`] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder={`Enter ${variableToLabel(variableName).toLowerCase()}`}
                      />
                      {errors[`variable_${variableName}`] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors[`variable_${variableName}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Preview */}
            {Object.keys(templateVariables).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preview
                </h4>
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Title:</span>
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                      {replaceVariables(formData.title, templateVariables) || 'Enter title...'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Description:</span>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {replaceVariables(formData.description, templateVariables) || 'Enter description...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Two-column layout for smaller fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as any)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assign To */}
              <div>
                <label htmlFor="assigned_to_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assign To
                </label>
                <select
                  id="assigned_to_id"
                  value={formData.assigned_to_id || ''}
                  onChange={(e) => handleFieldChange('assigned_to_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Estimated Hours */}
              <div>
                <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  min="0"
                  step="0.5"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => handleFieldChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.estimated_hours ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0.0"
                />
                {errors.estimated_hours && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.estimated_hours}</p>
                )}
              </div>

              {/* Points */}
              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Points
                </label>
                <input
                  type="number"
                  id="points"
                  min="0"
                  value={formData.points || ''}
                  onChange={(e) => handleFieldChange('points', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.points ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="0"
                />
                {errors.points && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.points}</p>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date
              </label>
              <input
                type="datetime-local"
                id="due_date"
                value={formData.due_date || ''}
                onChange={(e) => handleFieldChange('due_date', e.target.value || undefined)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
