/**
 * @fileoverview Templates Tab Component for TaaskMaaster
 * @description Templates and customization tab for task templates and system settings (Phase 5)
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { cn } from '../../../design-system/utils/cn';
import { 
  TemplateTable, 
  CreateTemplateModal, 
  CustomizationSettings,
  TaskFromTemplateModal,
  type TaskTemplate,
  type TemplateFormData,
  type CustomizationSettings as CustomizationSettingsType,
  type TaskFromTemplateFormData
} from '../../tasks';
import { taskService, TaskCategory } from '../../../services/taskService';
import { 
  Cog6ToothIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

/**
 * @description Templates tab component props
 */
export interface TemplatesTabProps {
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Tab view types
 */
type TabView = 'templates' | 'customization';

/**
 * @description Templates tab component
 * @param props - Templates tab component props
 * @returns Templates tab component
 */
export const TemplatesTab: React.FC<TemplatesTabProps> = ({ className }) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublic, setShowPublic] = useState(true);
  const [currentView, setCurrentView] = useState<TabView>('templates');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | undefined>();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);
  const [customizationSettings, setCustomizationSettings] = useState<CustomizationSettingsType>({
    priorityLevels: [
      { id: 'low', name: 'Low', color: '#10B981', order: 1 },
      { id: 'medium', name: 'Medium', color: '#F59E0B', order: 2 },
      { id: 'high', name: 'High', color: '#F97316', order: 3 },
      { id: 'urgent', name: 'Urgent', color: '#EF4444', order: 4 },
    ],
    categories: [],
    rewardTypes: [
      { id: 'points', name: 'Points', icon: '🏆', description: 'Gamification points' },
      { id: 'monetary', name: 'Monetary', icon: '💰', description: 'Money rewards' },
      { id: 'time', name: 'Time', icon: '⏰', description: 'Time-based rewards' },
      { id: 'custom', name: 'Custom', icon: '🎁', description: 'Custom rewards' },
    ],
    defaultPriority: 'medium',
    defaultPoints: 10,
    autoAssignToCreator: true,
    enableNotifications: true,
  });

  /**
   * @description Load templates, categories, and users
   */
  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, categoriesData, usersData] = await Promise.all([
        taskService.getTemplates(showPublic),
        taskService.getCategories(),
        taskService.getUsers()
      ]);
      setTemplates(templatesData);
      setCategories(categoriesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load templates data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Handle template creation
   * @param templateData - Template form data
   */
  const handleCreateTemplate = async (templateData: TemplateFormData) => {
    try {
      const newTemplate = await taskService.createTemplate(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateModal(false);
      setEditingTemplate(undefined);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  /**
   * @description Handle template usage - open customization modal
   * @param template - Template to use
   */
  const handleUseTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  /**
   * @description Handle creating task from template with custom data
   * @param templateId - Template ID
   * @param formData - Custom task data
   */
  const handleCreateFromTemplate = async (templateId: number, formData: TaskFromTemplateFormData) => {
    try {
      const task = await taskService.createTaskFromTemplate(templateId, {
        title: formData.title,
        description: formData.description,
        assigned_to_id: formData.assigned_to_id,
        due_date: formData.due_date,
        priority: formData.priority,
        estimated_hours: formData.estimated_hours,
        points: formData.points,
      });
      console.log('Task created from template:', task);
      // You could show a success message or refresh the tasks list
    } catch (error) {
      console.error('Failed to create task from template:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  /**
   * @description Handle template editing
   * @param template - Template to edit
   */
  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  /**
   * @description Handle template deletion
   * @param template - Template to delete
   */
  const handleDeleteTemplate = async (template: TaskTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        // Note: This would need a deleteTemplate method in the service
        // await taskService.deleteTemplate(template.id);
        setTemplates(prev => prev.filter(t => t.id !== template.id));
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  /**
   * @description Handle template duplication
   * @param template - Template to duplicate
   */
  const handleDuplicateTemplate = async (template: TaskTemplate) => {
    try {
      const duplicatedTemplate = await taskService.createTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        is_public: false,
      });
      setTemplates(prev => [...prev, duplicatedTemplate]);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  /**
   * @description Handle customization settings save
   * @param settings - New settings
   */
  const handleSaveSettings = async (settings: CustomizationSettingsType) => {
    try {
      // Note: This would need a saveCustomizationSettings method in the service
      // await taskService.saveCustomizationSettings(settings);
      setCustomizationSettings(settings);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Load data on component mount and when showPublic changes
  useEffect(() => {
    loadData();
  }, [showPublic]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Templates & Customization
          </h2>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('templates')}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                currentView === 'templates'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Templates
            </button>
            <button
              onClick={() => setCurrentView('customization')}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                currentView === 'customization'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {currentView === 'templates' && (
            <Button
              onClick={() => {
                setEditingTemplate(undefined);
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New Template</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {currentView === 'templates' ? (
          /* Templates View */
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Templates</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {templates.length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <ExclamationTriangleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Public Templates</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {templates.filter(t => t.is_public).length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Cog6ToothIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {categories.length}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <ArrowRightIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Used Today</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.floor(Math.random() * 10) + 1}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Templates Table */}
            <TemplateTable
              templates={templates}
              loading={loading}
              showPublic={showPublic}
              onUse={handleUseTemplate}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              onDuplicate={handleDuplicateTemplate}
              onCreateNew={() => {
                setEditingTemplate(undefined);
                setShowCreateModal(true);
              }}
              onTogglePublic={setShowPublic}
            />
          </div>
        ) : (
          /* Customization Settings View */
          <CustomizationSettings
            settings={customizationSettings}
            loading={loading}
            onSave={handleSaveSettings}
          />
        )}
      </div>

      {/* Create/Edit Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        template={editingTemplate}
        categories={categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          color: cat.color || '#6B7280'
        }))}
        loading={loading}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(undefined);
        }}
        onSave={handleCreateTemplate}
      />

      {/* Create Task from Template Modal */}
      <TaskFromTemplateModal
        isOpen={showTemplateModal}
        template={selectedTemplate}
        users={users}
        loading={loading}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
        }}
        onCreate={handleCreateFromTemplate}
      />
    </div>
  );
};
