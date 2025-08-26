/**
 * @fileoverview Tasks Tab Component for TaaskMaaster
 * @description Comprehensive task management tab with quick actions, filtering, and organization
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { TaskList, Task as FrontendTask } from '../../tasks';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowsUpDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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
  onUpdateTask: (taskId: string, updates: Partial<FrontendTask>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask: (taskId: string) => void;
  /**
   * @description Function to handle task status change
   */
  onStatusChange: (taskId: string, status: FrontendTask['status']) => void;
  /**
   * @description Function to handle task assignment
   */
  onAssignTask: (taskId: string, userId: string) => void;
  /**
   * @description Function to refresh tasks
   */
  onRefresh: () => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Quick Actions Bar component
 */
interface QuickActionsBarProps {
  onCreateTask: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ onCreateTask, onRefresh, onExport }) => (
  <Card className="p-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <Button onClick={onCreateTask} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Task
        </Button>
        <Button onClick={onRefresh} className="bg-gray-600 hover:bg-gray-700 text-white">
          <EyeIcon className="w-4 h-4 mr-2" />
          View All Tasks
        </Button>
        <Button onClick={onExport} className="bg-green-600 hover:bg-green-700 text-white">
          <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  </Card>
);

/**
 * @description Recent Activity Widget component
 */
interface RecentActivityWidgetProps {
  tasks: FrontendTask[];
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ tasks }) => {
  const getRecentActivity = () => {
    return tasks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  };

  const getStatusIcon = (status: FrontendTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: FrontendTask['status']) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'in_progress':
        return 'in progress';
      case 'overdue':
        return 'overdue';
      default:
        return 'created';
    }
  };

  const recentActivity = getRecentActivity();

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {recentActivity.length > 0 ? (
          recentActivity.map((task) => (
            <div key={task.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
              {getStatusIcon(task.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <p className="text-xs text-gray-500">
                  {getStatusText(task.status)} • {new Date(task.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {task.assignedTo || 'Unassigned'}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </Card>
  );
};

/**
 * @description Search and Filters component
 */
interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: string;
    priority: string;
    category: string;
    assignee: string;
  };
  onFilterChange: (filter: string, value: string) => void;
  onClearFilters: () => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters
}) => (
  <Card className="p-4">
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* Clear Filters */}
      <div className="flex justify-between items-center">
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          <FunnelIcon className="w-4 h-4 mr-1" />
          Clear All Filters
        </button>
      </div>
    </div>
  </Card>
);

/**
 * @description View Options component
 */
interface ViewOptionsProps {
  viewMode: 'compact' | 'expanded';
  onViewModeChange: (mode: 'compact' | 'expanded') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const ViewOptions: React.FC<ViewOptionsProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange
}) => (
  <Card className="p-4">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <div className="flex border border-gray-300 rounded-lg">
          <button
            onClick={() => onViewModeChange('compact')}
            className={cn(
              "px-3 py-1 text-sm",
              viewMode === 'compact'
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            Compact
          </button>
          <button
            onClick={() => onViewModeChange('expanded')}
            className={cn(
              "px-3 py-1 text-sm",
              viewMode === 'expanded'
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            Expanded
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="created">Created Date</option>
          <option value="due">Due Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="title">Title</option>
        </select>
        <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  </Card>
);

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
  onRefresh,
  className 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    assignee: ''
  });
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [sortBy, setSortBy] = useState('created');

  const handleFilterChange = (filter: string, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      assignee: ''
    });
    setSearchTerm('');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export tasks');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Actions Bar */}
      <QuickActionsBar 
        onCreateTask={onCreateTask}
        onRefresh={onRefresh}
        onExport={handleExport}
      />

      {/* Recent Activity and Search Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
        <div>
          <RecentActivityWidget tasks={tasks} />
        </div>
      </div>

      {/* View Options */}
      <ViewOptions
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Task List */}
      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onAssignTask={onAssignTask}
        className={className}
      />
    </div>
  );
};
