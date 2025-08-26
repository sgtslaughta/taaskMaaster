/**
 * @fileoverview Template Table Component for TaaskMaaster
 * @description Table layout component for displaying task templates with sorting and actions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { Input } from '../../design-system/components/Input';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { TaskTemplate } from './TemplateCard';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  TagIcon,
  StarIcon
} from '@heroicons/react/24/outline';

/**
 * @description Template table component props
 */
export interface TemplateTableProps {
  /**
   * @description List of templates to display
   */
  templates: TaskTemplate[];
  /**
   * @description Whether the table is in a loading state
   */
  loading?: boolean;
  /**
   * @description Whether to show public templates
   */
  showPublic?: boolean;
  /**
   * @description Callback when template is used
   */
  onUse?: (template: TaskTemplate) => void;
  /**
   * @description Callback when template is edited
   */
  onEdit?: (template: TaskTemplate) => void;
  /**
   * @description Callback when template is deleted
   */
  onDelete?: (template: TaskTemplate) => void;
  /**
   * @description Callback when template is duplicated
   */
  onDuplicate?: (template: TaskTemplate) => void;
  /**
   * @description Callback when new template is created
   */
  onCreateNew?: () => void;
  /**
   * @description Callback when public visibility is toggled
   */
  onTogglePublic?: (show: boolean) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Sort field types
 */
type SortField = 'name' | 'priority' | 'points' | 'estimated_hours' | 'created_at' | 'category';

/**
 * @description Sort direction types
 */
type SortDirection = 'asc' | 'desc';

/**
 * @description Get priority color class
 * @param priority - Task priority
 * @returns CSS class for priority color
 */
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
  }
};

/**
 * @description Get priority label
 * @param priority - Task priority
 * @returns Human-readable priority label
 */
const getPriorityLabel = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

/**
 * @description Template table component
 * @param props - Template table component props
 * @returns Template table component
 */
export const TemplateTable: React.FC<TemplateTableProps> = ({
  templates,
  loading = false,
  showPublic = true,
  onUse,
  onEdit,
  onDelete,
  onDuplicate,
  onCreateNew,
  onTogglePublic,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get unique categories and priorities for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        uniqueCategories.add(template.category.name);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [templates]);

  const priorities = useMemo(() => {
    const uniquePriorities = new Set<string>();
    templates.forEach(template => {
      uniquePriorities.add(template.priority);
    });
    return Array.from(uniquePriorities).sort();
  }, [templates]);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.title_pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        template.category?.name === selectedCategory;

      // Priority filter
      const matchesPriority = selectedPriority === 'all' || 
        template.priority === selectedPriority;

      // Public filter
      const matchesPublic = showPublic || !template.is_public;

      return matchesSearch && matchesCategory && matchesPriority && matchesPublic;
    });

    // Sort templates
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'points':
          aValue = a.points;
          bValue = b.points;
          break;
        case 'estimated_hours':
          aValue = a.estimated_hours;
          bValue = b.estimated_hours;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'category':
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedPriority, showPublic, sortBy, sortDirection]);

  /**
   * @description Handle sort change
   * @param field - Field to sort by
   */
  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Search and filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {Array.from({ length: 8 }).map((_, index) => (
                  <th key={index} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 8 }).map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>

          {/* Public Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePublic?.(!showPublic)}
            className="flex items-center gap-2"
          >
            {showPublic ? (
              <>
                <EyeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Hide Public</span>
              </>
            ) : (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Show Public</span>
              </>
            )}
          </Button>

          {/* Create New */}
          <Button
            onClick={onCreateNew}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">New Template</span>
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {filteredAndSortedTemplates.length} template{filteredAndSortedTemplates.length !== 1 ? 's' : ''} found
        </p>
        {(searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedPriority('all');
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Templates Table */}
      {filteredAndSortedTemplates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSortChange('name')}
                >
                  <div className="flex items-center justify-between">
                    <span>Template Name</span>
                    {sortBy === 'name' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSortChange('priority')}
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSortChange('category')}
                >
                  <div className="flex items-center justify-between">
                    <span>Category</span>
                    {sortBy === 'category' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSortChange('points')}
                >
                  <div className="flex items-center justify-between">
                    <span>Points</span>
                    {sortBy === 'points' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSortChange('estimated_hours')}
                >
                  <div className="flex items-center justify-between">
                    <span>Est. Hours</span>
                    {sortBy === 'estimated_hours' && (
                      sortDirection === 'asc' ? 
                        <ChevronUpIcon className="w-4 h-4" /> : 
                        <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedTemplates.map((template) => (
                <tr 
                  key={template.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {template.title_pattern}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {template.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getPriorityColor(template.priority)
                    )}>
                      {getPriorityLabel(template.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.category ? (
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: template.category.color }}
                        ></div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {template.category.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      {template.points}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <ClockIcon className="h-4 w-4 mr-1 text-blue-500" />
                      {template.estimated_hours}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {template.is_public ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200">
                          Private
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onUse?.(template)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Use Template"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit?.(template)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Edit Template"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicate?.(template)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Duplicate Template"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete?.(template)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Template"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FunnelIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first template'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && selectedPriority === 'all' && (
            <Button onClick={onCreateNew}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
