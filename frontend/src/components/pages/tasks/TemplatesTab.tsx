/**
 * @fileoverview Templates Tab Component for TaaskMaaster
 * @description Templates and customization tab for task templates and system settings (Phase 4)
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';

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
 * @description Templates tab component
 * @param props - Templates tab component props
 * @returns Templates tab component
 */
export const TemplatesTab: React.FC<TemplatesTabProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <div className="p-8 text-center">
          <div className="mb-4">
            <span className="text-4xl">🎨</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Templates & Customization
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create and manage task templates, custom priorities, categories, and reward types.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Coming in Phase 4:</strong> Template system, customization settings, 
              advanced configuration options, and template sharing.
            </p>
          </div>
        </div>
      </Card>

      {/* Placeholder for future content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Template Management</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Create task templates</p>
              <p>• Template variables</p>
              <p>• Template categories</p>
              <p>• Template sharing</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Customization</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Custom priority levels</p>
              <p>• Custom categories</p>
              <p>• Custom reward types</p>
              <p>• Default settings</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Template Library</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Public template library</p>
              <p>• Import/export templates</p>
              <p>• Community templates</p>
              <p>• Template ratings</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">System Settings</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Notification preferences</p>
              <p>• Auto-assignment rules</p>
              <p>• Default values</p>
              <p>• Theme customization</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Example templates preview */}
      <Card>
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Example Templates</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Daily Chore Template</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Make bed, brush teeth, feed pets</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Homework Template</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Math, reading, science projects</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Shopping Template</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Groceries, household items</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Customization preview */}
      <Card>
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Customization Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Priority Levels</h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Medium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Reward Types</h5>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• 💰 Monetary ($5.00, $10.00)</p>
                <p>• 🏆 Points (10pts, 25pts)</p>
                <p>• ⏰ Time (30min, 1hr)</p>
                <p>• 🎁 Custom (ice cream, movie)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
