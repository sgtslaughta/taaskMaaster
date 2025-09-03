/**
 * @fileoverview Customization Settings Component for TaaskMaaster
 * @description Component for managing system-wide customization settings
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { cn } from '../../design-system/utils/cn';
import { 
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PaintBrushIcon,
  TagIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * @description Priority level interface
 */
export interface PriorityLevel {
  id: string;
  name: string;
  color: string;
  order: number;
}

/**
 * @description Category interface
 */
export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
}

/**
 * @description Reward type interface
 */
export interface RewardType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

/**
 * @description Customization settings interface
 */
export interface CustomizationSettings {
  priorityLevels: PriorityLevel[];
  categories: Category[];
  rewardTypes: RewardType[];
  defaultPriority: string;
  defaultPoints: number;
  autoAssignToCreator: boolean;
  enableNotifications: boolean;
}

/**
 * @description Customization settings component props
 */
export interface CustomizationSettingsProps {
  /**
   * @description Current settings
   */
  settings: CustomizationSettings;
  /**
   * @description Whether the component is in a loading state
   */
  loading?: boolean;
  /**
   * @description Callback when settings are saved
   */
  onSave: (settings: CustomizationSettings) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Default priority levels
 */
const defaultPriorityLevels: PriorityLevel[] = [
  { id: 'low', name: 'Low', color: '#10B981', order: 1 },
  { id: 'medium', name: 'Medium', color: '#F59E0B', order: 2 },
  { id: 'high', name: 'High', color: '#F97316', order: 3 },
  { id: 'urgent', name: 'Urgent', color: '#EF4444', order: 4 },
];

/**
 * @description Default reward types
 */
const defaultRewardTypes: RewardType[] = [
  { id: 'points', name: 'Points', icon: '🏆', description: 'Gamification points' },
  { id: 'monetary', name: 'Monetary', icon: '💰', description: 'Money rewards' },
  { id: 'time', name: 'Time', icon: '⏰', description: 'Time-based rewards' },
  { id: 'custom', name: 'Custom', icon: '🎁', description: 'Custom rewards' },
];

/**
 * @description Customization settings component
 * @param props - Customization settings component props
 * @returns Customization settings component
 */
export const CustomizationSettings: React.FC<CustomizationSettingsProps> = ({
  settings,
  loading = false,
  onSave,
  className
}) => {
  const [localSettings, setLocalSettings] = useState<CustomizationSettings>(settings);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState({ name: '', color: '#3B82F6' });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6', icon: '' });

  /**
   * @description Handle priority level changes
   * @param id - Priority ID
   * @param field - Field to update
   * @param value - New value
   */
  const updatePriority = (id: string, field: keyof PriorityLevel, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      priorityLevels: prev.priorityLevels.map(priority =>
        priority.id === id ? { ...priority, [field]: value } : priority
      )
    }));
  };

  /**
   * @description Handle category changes
   * @param id - Category ID
   * @param field - Field to update
   * @param value - New value
   */
  const updateCategory = (id: number, field: keyof Category, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === id ? { ...category, [field]: value } : category
      )
    }));
  };

  /**
   * @description Add new priority level
   */
  const addPriority = () => {
    if (newPriority.name.trim()) {
      const newPriorityLevel: PriorityLevel = {
        id: newPriority.name.toLowerCase().replace(/\s+/g, '-'),
        name: newPriority.name,
        color: newPriority.color,
        order: localSettings.priorityLevels.length + 1,
      };
      setLocalSettings(prev => ({
        ...prev,
        priorityLevels: [...prev.priorityLevels, newPriorityLevel]
      }));
      setNewPriority({ name: '', color: '#3B82F6' });
    }
  };

  /**
   * @description Remove priority level
   * @param id - Priority ID to remove
   */
  const removePriority = (id: string) => {
    if (localSettings.priorityLevels.length > 1) {
      setLocalSettings(prev => ({
        ...prev,
        priorityLevels: prev.priorityLevels.filter(priority => priority.id !== id)
      }));
    }
  };

  /**
   * @description Add new category
   */
  const addCategory = () => {
    if (newCategory.name.trim()) {
      const newCategoryItem: Category = {
        id: Date.now(), // Temporary ID for new categories
        name: newCategory.name,
        color: newCategory.color,
        icon: newCategory.icon,
      };
      setLocalSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategoryItem]
      }));
      setNewCategory({ name: '', color: '#3B82F6', icon: '' });
    }
  };

  /**
   * @description Remove category
   * @param id - Category ID to remove
   */
  const removeCategory = (id: number) => {
    setLocalSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id)
    }));
  };

  /**
   * @description Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <form onSubmit={handleSubmit}>
        {/* Priority Levels */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Priority Levels
            </h3>
            
            <div className="space-y-4">
              {/* Existing Priority Levels */}
              {localSettings.priorityLevels.map(priority => (
                <div key={priority.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: priority.color }}
                  ></div>
                  
                  {editingPriority === priority.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        value={priority.name}
                        onChange={(e) => updatePriority(priority.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={priority.color}
                        onChange={(e) => updatePriority(priority.id, 'color', e.target.value)}
                        className="w-12"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setEditingPriority(null)}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {priority.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPriority(priority.id)}
                        >
                          <PaintBrushIcon className="h-4 w-4" />
                        </Button>
                        {localSettings.priorityLevels.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removePriority(priority.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Priority */}
              <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <PlusIcon className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="New priority name"
                  value={newPriority.name}
                  onChange={(e) => setNewPriority(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={newPriority.color}
                  onChange={(e) => setNewPriority(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addPriority}
                  disabled={!newPriority.name.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Categories */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TagIcon className="h-5 w-5 mr-2" />
              Categories
            </h3>
            
            <div className="space-y-4">
              {/* Existing Categories */}
              {localSettings.categories.map(category => (
                <div key={category.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  
                  {editingCategory === category.id ? (
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={category.color}
                        onChange={(e) => updateCategory(category.id, 'color', e.target.value)}
                        className="w-12"
                      />
                      <Input
                        placeholder="Icon"
                        value={category.icon || ''}
                        onChange={(e) => updateCategory(category.id, 'icon', e.target.value)}
                        className="w-16"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setEditingCategory(null)}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {category.icon && <span>{category.icon}</span>}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCategory(category.id)}
                        >
                          <PaintBrushIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Category */}
              <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <PlusIcon className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12"
                />
                <Input
                  placeholder="Icon"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-16"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addCategory}
                  disabled={!newCategory.name.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Reward Types */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <StarIcon className="h-5 w-5 mr-2" />
              Reward Types
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localSettings.rewardTypes.map(rewardType => (
                <div key={rewardType.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-2xl">{rewardType.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rewardType.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {rewardType.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Default Settings */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Default Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Priority
                </label>
                <select
                  value={localSettings.defaultPriority}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultPriority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {localSettings.priorityLevels.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Points
                </label>
                <Input
                  type="number"
                  min="0"
                  value={localSettings.defaultPoints}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultPoints: parseInt(e.target.value) || 0 }))}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Auto-assign to creator</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically assign new tasks to the user who created them
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.autoAssignToCreator}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, autoAssignToCreator: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Enable notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send notifications for task updates and reminders
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.enableNotifications}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={loading}
            className="px-6"
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
