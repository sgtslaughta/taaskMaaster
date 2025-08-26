/**
 * @fileoverview Template Grid Component for TaaskMaaster
 * @description Grid layout component for displaying task templates with filtering and search
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { TemplateCard, TaskTemplate } from './TemplateCard';
import { Input } from '../../design-system/components/Input';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

/**
 * @description Template grid component props
 */
export interface TemplateGridProps {
  /**
   * @description List of templates to display
   */
  templates: TaskTemplate[];
  /**
   * @description Whether the grid is in a loading state
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
 * @description Template grid component
 * @param props - Template grid component props
 * @returns Template grid component
 */
export const TemplateGrid: React.FC<TemplateGridProps> = ({
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

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
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
  }, [templates, searchQuery, selectedCategory, selectedPriority, showPublic]);

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

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
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
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
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

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={onUse}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
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
