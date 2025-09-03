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
import { taskService, TaskFilterOptions, TaskListResponse } from '../../../services/taskService';
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
   * @description Function to handle task creation
   */
  onCreateTask: () => void;
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
              {users && users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
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
  onCreateTask,
  users = [],
  className
}) => {
  const { user } = useAuth();

  // Internal state management
  const [tasks, setTasks] = useState<FrontendTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskListResponse, setTaskListResponse] = useState<TaskListResponse | null>(null);

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Update selectedTask when tasks array changes (after updates)
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(task => task.id === selectedTask.id);
      if (updatedTask) {

        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  // Pagination calculations from server response
  const totalItems = taskListResponse?.total || 0;
  const totalPages = taskListResponse?.pages || 0;
  const currentServerPage = taskListResponse?.page || 1;

  // Load tasks from API with pagination
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options: TaskFilterOptions = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        assigned_to_id: filters.assignee && filters.assignee !== 'unassigned' ? parseInt(filters.assignee) : undefined,
        reward_type: filters.rewardType || undefined,
      };

      // Handle unassigned filter - we'll need to handle this on frontend since API doesn't support it directly
      const response = await taskService.getTasks(options);
      setTaskListResponse(response);
      
      // Convert backend tasks to frontend format
      const frontendTasks = response.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        estimatedHours: task.estimated_hours,
        actualHours: task.actual_hours,
        points: task.points || 0,
        tags: task.tags || [],
        assignedTo: task.assigned_to ? {
          id: task.assigned_to.id,
          username: task.assigned_to.username,
          email: task.assigned_to.email,
          firstName: task.assigned_to.first_name,
          lastName: task.assigned_to.last_name
        } : undefined,
        createdById: task.created_by_id,
        assignedToId: task.assigned_to_id,
        categoryId: task.category_id,
        category: task.category ? {
          id: task.category.id,
          name: task.category.name,
          description: task.category.description,
          color: task.category.color
        } : undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        rewardType: task.reward_type,
        rewardValue: task.reward_value,
        rewardDescription: task.reward_description
      }));
      
      setTasks(frontendTasks);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tasks on component mount and when pagination/filters change
  useEffect(() => {
    loadTasks();
  }, [currentPage, itemsPerPage, searchTerm, filters, sortBy, sortDirection]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy, sortDirection]);

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

  const handleTaskUpdate = async (taskId: number, updates: Partial<FrontendTask>) => {
    try {
      // Convert frontend updates to backend format
      const backendUpdates: any = {};
      
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.status !== undefined) backendUpdates.status = updates.status;
      if (updates.priority !== undefined) backendUpdates.priority = updates.priority;
      if (updates.dueDate !== undefined) backendUpdates.due_date = updates.dueDate;
      if (updates.points !== undefined) backendUpdates.points = updates.points;
      if (updates.assignedToId !== undefined) {
        backendUpdates.assigned_to_id = updates.assignedToId;
      }
      if (updates.assignedTo !== undefined) {
        // Handle assignedTo as user object with id property
        if (updates.assignedTo === null) {
          backendUpdates.assigned_to_id = null;
        } else if (typeof updates.assignedTo === 'object' && updates.assignedTo.id) {
          backendUpdates.assigned_to_id = parseInt(updates.assignedTo.id);
        } else if (typeof updates.assignedTo === 'string' || typeof updates.assignedTo === 'number') {
          backendUpdates.assigned_to_id = parseInt(updates.assignedTo.toString());
        }
      }
      if (updates.category !== undefined) {
        // Handle category update - backend expects category name as string
        backendUpdates.category = updates.category?.name || null;
      }

      await taskService.updateTask(taskId, backendUpdates);
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleTaskComplete = async (taskId: number) => {
    try {
      await taskService.completeTask(taskId);
      await loadTasks();
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const handleRefresh = () => {
    loadTasks();
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



  const handleTaskDeleteFromModal = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
      setIsDetailModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
  };

  const handleBulkUpdate = async (taskIds: number[], updates: Partial<FrontendTask>) => {
    try {
      // Implement bulk update via API
      // For now, just reload tasks
      await loadTasks();
      setSelectedTasks([]);
    } catch (err) {
      console.error('Error bulk updating tasks:', err);
    }
  };

  const handleExportSubmit = (exportData: TaskExportData) => {
    // Implement export functionality
    console.log('Export data:', exportData);
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
    setSelectedTasks([...tasks]);
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
        onRefresh={handleRefresh}
      />

      {/* Task Table */}
      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No tasks found. Create your first task to get started!</p>
          </div>
        ) : (
          <TaskTable
            tasks={tasks}
            viewMode={viewMode}
            selectedTasks={selectedTasks}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onTaskSelect={handleTaskSelect}
            onTaskClick={handleTaskClick}
            onStatusChange={(taskId: number, status: FrontendTask['status']) => {
              // Handle status change
              handleTaskUpdate(taskId, { status });
            }}
            onDeleteTask={handleTaskDelete}
            onCompleteTask={handleTaskComplete}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className={`flex items-center ${totalPages > 1 ? 'justify-between' : 'justify-start'}`}>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            {/* Only show page navigation when there are multiple pages */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          task={selectedTask}
          users={users}
          categories={['Household', 'Personal', 'Work', 'School', 'Health', 'Other']}
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDeleteFromModal}
          onCompleteTask={handleTaskComplete}
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
