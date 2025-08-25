/**
 * @fileoverview Lists Tab Component for TaaskMaaster
 * @description Task lists tab for organizing tasks into custom groups (Phase 3)
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';

/**
 * @description Lists tab component props
 */
export interface ListsTabProps {
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Lists tab component
 * @param props - Lists tab component props
 * @returns Lists tab component
 */
export const ListsTab: React.FC<ListsTabProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <div className="p-8 text-center">
          <div className="mb-4">
            <span className="text-4xl">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Task Lists
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Organize tasks into custom lists for better grouping and management.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Coming in Phase 3:</strong> List creation, drag-and-drop organization, 
              list sharing, and collaborative task management.
            </p>
          </div>
        </div>
      </Card>

      {/* Placeholder for future content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">List Management</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Create custom task lists</p>
              <p>• Import/export lists</p>
              <p>• List templates</p>
              <p>• List categories</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Organization</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Drag-and-drop reordering</p>
              <p>• Move tasks between lists</p>
              <p>• Bulk operations</p>
              <p>• List hierarchies</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Collaboration</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Share lists with family</p>
              <p>• Collaborative editing</p>
              <p>• Activity tracking</p>
              <p>• Permission management</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">List Features</h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• List statistics</p>
              <p>• Progress tracking</p>
              <p>• Due date management</p>
              <p>• List notifications</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Example list preview */}
      <Card>
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Example Lists</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Daily Chores</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">8 tasks • 3 completed</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Weekly Goals</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">12 tasks • 5 completed</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Shopping</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">5 tasks • 2 completed</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
