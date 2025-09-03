/**
 * @fileoverview Tasks Tab Component for TaaskMaaster
 * @description Comprehensive task management tab with table layout and advanced controls
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { TaskList, Task as FrontendTask } from '../../tasks';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';
import { WorkflowStatusBadge, type WorkflowStatus } from '../../workflow/WorkflowStatusBadge';
import { TaskDetailModal } from '../../tasks/TaskDetailModal';
import { BulkEditModal } from '../../tasks/BulkEditModal';
import { TaskExportModal, TaskExportData } from '../../tasks/TaskExportModal';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowsUpDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  StarIcon,
  Cog6ToothIcon,
  ViewColumnsIcon,
  AdjustmentsHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

/**
 * @description Tasks tab component props
 */
export interface TasksTabProps {
  /**
   * @description Tasks to display
   */
  tasks: FrontendTask[];
  /**
   * @description Loading state
   */
  loading: boolean;
  /**
   * @description Error state
   */
  error: string | null;
  /**
   * @description Function to handle task creation
   */
  onCreateTask: () => void;
  /**
   * @description Function to handle task update
   */
  onUpdateTask: (taskId: number, updates: Partial<FrontendTask>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask: (taskId: number) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange: (taskId: number, status: FrontendTask['status']) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssignTask: (taskId: number, userId: number) => void;
  /**
   * @description Function to handle task completion
   */
  onCompleteTask?: (taskId: number) => void;
  /**
   * @description Function to handle bulk update
   */
  onBulkUpdate?: (taskIds: number[], updates: Partial<FrontendTask>) => void;
  /**
   * @description Function to handle task export
   */
  onExport?: (exportData: TaskExportData) => void;
  /**
   * @description Function to refresh tasks
   */
  onRefresh: () => void;
  /**
   * @description Available users for assignment
   */
  users?: any[];
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Table Toolbar component
 */
interface TableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: any;
  onFilterChange: (filter: string, value: string) => void;
  onClearFilters: () => void;
  viewMode: 'compact' | 'expanded';
  onViewModeChange: (mode: 'compact' | 'expanded') => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sort: string) => void;
  selectedTasksCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCreateTask: () => void;
  onExport: () => void;
  onBulkEdit: () => void;
  onRefresh: () => void;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSortChange,
  selectedTasksCount,
  onSelectAll,
  onDeselectAll,
  onCreateTask,
  onExport,
  onBulkEdit,
  onRefresh
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col space-y-4">
        {/* Top Row - Search and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => onViewModeChange('compact')}
                className={cn(
                  "p-2 text-sm transition-colors",
                  viewMode === 'compact'
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                )}
                title="Compact View"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('expanded')}
                className={cn(
                  "p-2 text-sm transition-colors",
                  viewMode === 'expanded'
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                )}
                title="Expanded View"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors",
                showFilters 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              )}
              title="Toggle Filters"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>



            {/* Selection Controls */}
            {selectedTasksCount > 0 ? (
              <button
                onClick={onDeselectAll}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Deselect All"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onSelectAll}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                title="Select All"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
            )}

            {/* Action Buttons */}
            <button
              onClick={onCreateTask}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Create New Task"
            >
              <PlusIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onRefresh}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Tasks"
            >
              <EyeIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onExport}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Export Tasks"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </button>

            {selectedTasksCount > 0 && (
              <button
                onClick={onBulkEdit}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title={`Bulk Edit (${selectedTasksCount} selected)`}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Selection Count */}
        {selectedTasksCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTasksCount} task{selectedTasksCount !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="chores">Chores</option>
              <option value="homework">Homework</option>
              <option value="activities">Activities</option>
              <option value="shopping">Shopping</option>
            </select>

            <select
              value={filters.assignee}
              onChange={(e) => onFilterChange('assignee', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
            </select>

            <select
              value={filters.rewardType}
              onChange={(e) => onFilterChange('rewardType', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Rewards</option>
              <option value="points">Points</option>
              <option value="monetary">Money</option>
              <option value="time">Time</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @description Task Table component
 */
interface TaskTableProps {
  tasks: FrontendTask[];
  viewMode: 'compact' | 'expanded';
  selectedTasks: FrontendTask[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (sort: string) => void;
  onTaskSelect: (task: FrontendTask, selected: boolean) => void;
  onTaskClick: (task: FrontendTask) => void;
  onStatusChange: (taskId: number, status: FrontendTask['status']) => void;
  onDeleteTask: (taskId: number) => void;
  onCompleteTask?: (taskId: number) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  viewMode,
  selectedTasks,
  sortBy,
  sortDirection,
  onSortChange,
  onTaskSelect,
  onTaskClick,
  onStatusChange,
  onDeleteTask,
  onCompleteTask
}) => {


  const getPriorityColor = (priority: FrontendTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRewardDisplay = (task: FrontendTask) => {
    if (!task.rewardType || task.rewardValue === 0) {
      return null;
    }

    let display = `${task.rewardValue}`;
    
    switch (task.rewardType) {
      case 'monetary':
        display += ' USD';
        break;
      case 'time':
        display += ' min';
        break;
      case 'points':
        display += ' pts';
        break;
      case 'custom':
        display = task.rewardDescription || 'Custom';
        break;
    }

    return display;
  };

  const isTaskSelected = (task: FrontendTask) => {
    return selectedTasks.some(selectedTask => selectedTask.id === task.id);
  };

  if (viewMode === 'compact') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === tasks.length && tasks.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      tasks.forEach(task => onTaskSelect(task, true));
                    } else {
                      tasks.forEach(task => onTaskSelect(task, false));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onSortChange('title')}
              >
                <div className="flex items-center justify-between">
                  <span>Task</span>
                  {sortBy === 'title' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onSortChange('status')}
              >
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  {sortBy === 'status' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onSortChange('priority')}
              >
                <div className="flex items-center justify-between">
                  <span>Priority</span>
                  {sortBy === 'priority' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Assigned To
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onSortChange('due')}
              >
                <div className="flex items-center justify-between">
                  <span>Due Date</span>
                  {sortBy === 'due' && (
                    sortDirection === 'asc' ? 
                      <ChevronUpIcon className="w-4 h-4" /> : 
                      <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reward
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const isSelected = isTaskSelected(task);
              const rewardDisplay = getRewardDisplay(task);
              
              return (
                <tr 
                  key={task.id} 
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer",
                    isSelected && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => onTaskClick(task)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onTaskSelect(task, e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {task.category?.name || 'Uncategorized'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <WorkflowStatusBadge 
                      status={task.status as WorkflowStatus} 
                      compact={true}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {task.assignedTo?.username || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {rewardDisplay || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {task.status !== 'done' && onCompleteTask && (() => {
                        // Determine button appearance based on workflow state
                        const isSubmittedForApproval = task.status === 'submitted_for_approval';
                        const buttonClass = isSubmittedForApproval 
                          ? "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300";
                        const buttonTitle = isSubmittedForApproval 
                          ? "Approve Task Completion" 
                          : "Complete Task";
                        
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCompleteTask(task.id);
                            }}
                            className={buttonClass}
                            title={buttonTitle}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Task"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Expanded view - card layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => {
        const isSelected = isTaskSelected(task);
        const rewardDisplay = getRewardDisplay(task);
        
        return (
          <div 
            key={task.id} 
            className={cn(
              "bg-white dark:bg-gray-800 border rounded-lg p-4 transition-colors cursor-pointer",
              isSelected 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            )}
            onClick={() => onTaskClick(task)}
          >
            <div className="flex items-start justify-between mb-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onTaskSelect(task, e.target.checked);
                }}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                {task.status !== 'done' && onCompleteTask && (() => {
                  // Determine button appearance based on workflow state
                  const isSubmittedForApproval = task.status === 'submitted_for_approval';
                  const buttonClass = isSubmittedForApproval 
                    ? "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300";
                  const buttonTitle = isSubmittedForApproval 
                    ? "Approve Task Completion" 
                    : "Complete Task";
                  
                  return (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task.id);
                      }}
                      className={buttonClass}
                      title={buttonTitle}
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  );
                })()}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Task"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{task.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                <WorkflowStatusBadge 
                  status={task.status as WorkflowStatus} 
                  compact={true}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Priority:</span>
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  getPriorityColor(task.priority)
                )}>
                  {task.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assigned:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.assignedTo?.username || 'Unassigned'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Due:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </span>
              </div>
              
              {rewardDisplay && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reward:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {rewardDisplay}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * @description Tasks tab component
 * @param props - Tasks tab component props
 * @returns Tasks tab component
 */
export const TasksTab: React.FC<TasksTabProps> = ({ 
  tasks,
  loading,
  error,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
  onCompleteTask,
  onBulkUpdate,
  onExport,
  onRefresh,
  users = [],
  className 
}) => {
  const { user } = useAuth();

  /**
   * @description Check if user can edit a task
   * @param task - Task to check permissions for
   * @returns Whether user can edit the task
   */
  const canEditTask = (task: FrontendTask): boolean => {
    if (!user) return false;
    
    // Admins can edit any task
    if (user.role === 'admin') return true;
    
    // Task creators can edit their own tasks
    if (task.createdById === parseInt(user.id)) return true;
    
    // Assigned users can edit tasks assigned to them
    if (task.assignedToId === parseInt(user.id)) return true;
    
    return false;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignee: '',
    rewardType: ''
  });
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTasks, setSelectedTasks] = useState<FrontendTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<FrontendTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Update selectedTask when tasks array changes (after updates)
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedTask) {

        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || task.status === filters.status;
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      const matchesCategory = !filters.category || task.category?.name === filters.category;
      const matchesAssignee = !filters.assignee || 
        (filters.assignee === 'unassigned' && !task.assignedTo) ||
        (filters.assignee === 'assigned' && task.assignedTo);
      const matchesRewardType = !filters.rewardType || task.rewardType === filters.rewardType;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee && matchesRewardType;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'due':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'status':
          const statusOrder = { done: 4, cancelled: 3, in_progress: 2, todo: 1, review: 1 };
          comparison = statusOrder[b.status] - statusOrder[a.status];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
        default:
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, searchTerm, filters, sortBy, sortDirection]);

  const handleFilterChange = (filter: string, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      assignee: '',
      rewardType: ''
    });
    setSearchTerm('');
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleBulkEdit = () => {
    setIsBulkEditModalOpen(true);
  };

  const handleTaskClick = (task: FrontendTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleTaskUpdate = async (taskId: number, updates: Partial<FrontendTask>) => {
    if (onUpdateTask) {
      await onUpdateTask(taskId, updates);
      // Don't close modal automatically - let user close it manually
      // The task will be updated in the tasks list via the parent component
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    if (onDeleteTask) {
      await onDeleteTask(taskId);
      setIsDetailModalOpen(false);
      setSelectedTask(null);
    }
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleBulkUpdate = (taskIds: number[], updates: Partial<FrontendTask>) => {
    if (onBulkUpdate) {
      onBulkUpdate(taskIds, updates);
      setSelectedTasks([]);
    }
  };

  const handleExportSubmit = (exportData: TaskExportData) => {
    if (onExport) {
      onExport(exportData);
    }
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Reverse sort direction if clicking the same sort option
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to desc for most fields
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = () => {
    setSelectedTasks([...filteredAndSortedTasks]);
  };

  const handleDeselectAll = () => {
    setSelectedTasks([]);
  };

  const handleTaskSelect = (task: FrontendTask, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, task]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-lg shadow-sm', className)}>
      {/* Table Toolbar */}
      <TableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        selectedTasksCount={selectedTasks.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onCreateTask={onCreateTask}
        onExport={handleExport}
        onBulkEdit={handleBulkEdit}
        onRefresh={onRefresh}
      />

      {/* Task Table */}
      <div className="p-4">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <TaskTable
            tasks={filteredAndSortedTasks}
            viewMode={viewMode}
            selectedTasks={selectedTasks}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onTaskSelect={handleTaskSelect}
            onTaskClick={handleTaskClick}
            onStatusChange={onStatusChange}
            onDeleteTask={onDeleteTask}
            onCompleteTask={onCompleteTask}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          task={selectedTask}
          users={users}
          categories={['Household', 'Personal', 'Work', 'School', 'Health', 'Other']}
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onCompleteTask={onCompleteTask}
          loading={loading}
          canEdit={canEditTask(selectedTask)}
          currentUser={user}
        />
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedTasks={selectedTasks}
        users={users}
        onBulkUpdate={handleBulkUpdate}
        loading={loading}
      />

      {/* Export Modal */}
      <TaskExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportSubmit}
        loading={loading}
      />
    </div>
  );
};
