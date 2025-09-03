/**
 * @fileoverview Task Export Modal Component for TaaskMaaster
 * @description Modal for exporting tasks in various formats with filtering options
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
import { 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CalendarIcon,
  FunnelIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

/**
 * @description Task export modal component props
 */
export interface TaskExportModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Function to handle task export
   */
  onExport?: (exportData: TaskExportData) => void;
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
 * @description Task export data interface
 */
export interface TaskExportData {
  format: 'csv' | 'json';
  filters: {
    status?: string;
    priority?: string;
    category?: string;
    rewardType?: string;
    assignedTo?: string;
  };
  includeCompleted: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * @description Export format options
 */
const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values', icon: TableCellsIcon },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation', icon: DocumentTextIcon },
];

/**
 * @description Task export modal component
 * @param props - Task export modal component props
 * @returns Task export modal component
 */
export const TaskExportModal: React.FC<TaskExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  loading = false,
  className,
}) => {
  const [exportData, setExportData] = useState<TaskExportData>({
    format: 'csv',
    filters: {},
    includeCompleted: true,
  });

  /**
   * @description Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onExport) {
      onExport(exportData);
      onClose();
    }
  };

  /**
   * @description Reset form data
   */
  const handleReset = () => {
    setExportData({
      format: 'csv',
      filters: {},
      includeCompleted: true,
    });
  };

  /**
   * @description Update filter value
   */
  const updateFilter = (key: keyof TaskExportData['filters'], value: string) => {
    setExportData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value || undefined,
      },
    }));
  };

  /**
   * @description Update date range
   */
  const updateDateRange = (key: 'start' | 'end', value: string) => {
    setExportData(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value || undefined,
      },
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Tasks"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      className="dark:bg-gray-800 max-w-2xl mx-auto"
    >
      <div className="max-h-[85vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => setExportData(prev => ({ ...prev, format: format.value as 'csv' | 'json' }))}
                    className={cn(
                      "p-4 border rounded-lg text-left transition-colors",
                      exportData.format === format.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">{format.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{format.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Filters
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={exportData.filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={exportData.filters.priority || ''}
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Input
                  value={exportData.filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  placeholder="All categories"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Reward Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reward Type
                </label>
                <select
                  value={exportData.filters.rewardType || ''}
                  onChange={(e) => updateFilter('rewardType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Reward Types</option>
                  <option value="points">Points</option>
                  <option value="monetary">Money</option>
                  <option value="time">Time</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Date Range
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={exportData.dateRange?.start || ''}
                  onChange={(e) => updateDateRange('start', e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={exportData.dateRange?.end || ''}
                  onChange={(e) => updateDateRange('end', e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Options
            </h3>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeCompleted"
                checked={exportData.includeCompleted}
                onChange={(e) => setExportData(prev => ({ ...prev, includeCompleted: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeCompleted" className="text-sm text-gray-700 dark:text-gray-300">
                Include completed tasks
              </label>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Export Summary
                </h3>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <div>• Format: {exportData.format.toUpperCase()}</div>
                  <div>• Include completed: {exportData.includeCompleted ? 'Yes' : 'No'}</div>
                  {Object.keys(exportData.filters).length > 0 && (
                    <div>• Filters applied: {Object.keys(exportData.filters).length}</div>
                  )}
                  {exportData.dateRange?.start || exportData.dateRange?.end ? (
                    <div>• Date range: {exportData.dateRange.start || 'Any'} to {exportData.dateRange.end || 'Any'}</div>
                  ) : (
                    <div>• Date range: All dates</div>
                  )}
                </div>
              </div>
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
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                    Export Tasks
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
