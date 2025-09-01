/**
 * WorkflowStatusBadge Component
 * 
 * Displays task workflow status with appropriate colors, icons, and labels
 * Provides consistent status visualization across all task views
 */

import React from 'react';
import { cn } from '../../design-system/utils/cn';
import { 
  ClockIcon,
  UserIcon,
  PlayIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export type WorkflowStatus = 
  | 'todo' 
  | 'assigned' 
  | 'in_progress' 
  | 'submitted_for_approval' 
  | 'review' 
  | 'done' 
  | 'cancelled';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: ClockIcon,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    emoji: '📝'
  },
  assigned: {
    label: 'Assigned',
    icon: UserIcon,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    emoji: '👤'
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayIcon,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    emoji: '⚡'
  },
  submitted_for_approval: {
    label: 'Submitted',
    icon: PaperAirplaneIcon,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
    emoji: '📤'
  },
  review: {
    label: 'Review',
    icon: EyeIcon,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    emoji: '👀'
  },
  done: {
    label: 'Done',
    icon: CheckCircleIcon,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    emoji: '✅'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    emoji: '❌'
  }
};

/**
 * @description Workflow Status Badge Component
 * @param props - Component props
 * @returns JSX.Element
 */
export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  compact = false,
  showIcon = true,
  className
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const IconComponent = config.icon;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
          config.color,
          className
        )}
        title={config.label}
      >
        {showIcon && (
          <IconComponent className="w-3 h-3 mr-1" />
        )}
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        config.color,
        className
      )}
    >
      {showIcon && (
        <IconComponent className="w-4 h-4 mr-2" />
      )}
      <span>{config.label}</span>
    </div>
  );
};

/**
 * @description Get workflow status configuration
 * @param status - Workflow status
 * @returns Status configuration object
 */
export const getWorkflowStatusConfig = (status: WorkflowStatus) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.todo;
};

/**
 * @description Get workflow status color classes
 * @param status - Workflow status
 * @returns Color class string
 */
export const getWorkflowStatusColor = (status: WorkflowStatus) => {
  return STATUS_CONFIG[status]?.color || STATUS_CONFIG.todo.color;
};

export default WorkflowStatusBadge;
