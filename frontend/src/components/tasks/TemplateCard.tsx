/**
 * @fileoverview Template Card Component for TaaskMaaster
 * @description Individual template card component for displaying template information and actions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { Card } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { 
  ClockIcon, 
  TagIcon, 
  UserIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

/**
 * @description Task template interface
 */
export interface TaskTemplate {
  id: number;
  name: string;
  description?: string;
  title_pattern: string;
  description_template?: string;
  estimated_hours: number;
  points: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: number;
  tags?: string[];
  is_public: boolean;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    color: string;
    icon?: string;
  };
}

/**
 * @description Template card component props
 */
export interface TemplateCardProps {
  /**
   * @description Template data to display
   */
  template: TaskTemplate;
  /**
   * @description Whether the card is in a loading state
   */
  loading?: boolean;
  /**
   * @description Whether the card is selected
   */
  selected?: boolean;
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
   * @description Additional CSS classes
   */
  className?: string;
}

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
 * @description Template card component
 * @param props - Template card component props
 * @returns Template card component
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  loading = false,
  selected = false,
  onUse,
  onEdit,
  onDelete,
  onDuplicate,
  className
}) => {
  if (loading) {
    return (
      <Card className={cn('p-4 animate-pulse', className)}>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'p-4 transition-all duration-200 hover:shadow-md cursor-pointer',
        selected && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10',
        className
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {template.name}
            </h3>
            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          {template.is_public && (
            <div className="flex items-center text-blue-600 dark:text-blue-400 ml-2">
              <EyeIcon className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Template Pattern */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Title Pattern:</p>
          <p className="text-sm font-mono text-gray-900 dark:text-white">
            {template.title_pattern}
          </p>
        </div>

        {/* Template Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {template.estimated_hours > 0 && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{template.estimated_hours}h</span>
              </div>
            )}
            {template.points > 0 && (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <TagIcon className="h-4 w-4 mr-1" />
                <span>{template.points}pts</span>
              </div>
            )}
          </div>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            getPriorityColor(template.priority)
          )}>
            {getPriorityLabel(template.priority)}
          </span>
        </div>

        {/* Category */}
        {template.category && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: template.category.color }}
            ></div>
            <span>{template.category.name}</span>
          </div>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onUse?.(template);
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Use
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(template);
              }}
              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(template);
              }}
              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(template);
            }}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
