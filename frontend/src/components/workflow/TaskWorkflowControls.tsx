/**
 * TaskWorkflowControls Component
 * 
 * Provides workflow controls for task status transitions, approvals, and rejections.
 * Features permission-based UI visibility and real-time status updates.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../design-system/components/Button';
import { Modal } from '../../design-system/components/Modal';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { cn } from '../../design-system/utils/cn';
import {
  PlayIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

import { Task } from '../tasks/TaskList';
import { User } from '../../types/user';
import { taskService } from '../../services/taskService';

interface TaskWorkflowControlsProps {
  task: Task;
  currentUser: User;
  onTaskUpdate: (taskId: number, updates: { status: Task['status'] }) => void;
  onError: (error: string) => void;
  showHistory?: boolean;
  compact?: boolean;
}

interface TransitionDialog {
  open: boolean;
  type: 'transition' | 'approve' | 'reject';
  targetStatus?: Task['status'];
  reason: string;
  comment: string;
}

const STATUS_CONFIG = {
  todo: {
    label: 'Assigned',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    icon: '👤'
  },
  assigned: {
    label: 'Assigned',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
    icon: '👤'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: '⚡'
  },
  submitted_for_approval: {
    label: 'Submitted for Approval',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
    icon: '📤'
  },
  review: {
    label: 'Review',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    icon: '👀'
  },
  done: {
    label: 'Done',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    icon: '✅'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    icon: '❌'
  }
} as const;

const TaskWorkflowControls: React.FC<TaskWorkflowControlsProps> = ({
  task,
  currentUser,
  onTaskUpdate,
  onError,
  showHistory = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<TransitionDialog>({
    open: false,
    type: 'transition',
    reason: '',
    comment: ''
  });

  // Get current status configuration
  const currentStatusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.todo;

  // Calculate available actions based on current status and user permissions
  const availableActions = useMemo(() => {
    const actions = [];
    const isAssigned = task.assignedTo?.id === currentUser.id;
    const isCreator = task.createdById === parseInt(currentUser.id);

    switch (task.status) {
      case 'todo':
        if (isAssigned || isCreator) {
          actions.push({
            label: 'Start Task',
            icon: <PlayIcon className="w-4 h-4" />,
            variant: 'primary' as const,
            color: 'primary' as const,
            action: () => handleActionClick({ type: 'transition', targetStatus: 'in_progress' })
          });
        }
        break;

      case 'assigned':
        if (isAssigned) {
          actions.push({
            label: 'Start Working',
            icon: <PlayIcon className="w-4 h-4" />,
            variant: 'primary' as const,
            color: 'primary' as const,
            action: () => handleActionClick({ type: 'transition', targetStatus: 'in_progress' })
          });
        }
        break;

      case 'in_progress':
        if (isAssigned) {
          actions.push({
            label: 'Submit for Approval',
            icon: <PaperAirplaneIcon className="w-4 h-4" />,
            variant: 'primary' as const,
            color: 'primary' as const,
            action: () => handleActionClick({ type: 'transition', targetStatus: 'submitted_for_approval' })
          });
        }
        break;

      case 'submitted_for_approval':
        if (isCreator) {
          actions.push({
            label: 'Approve',
            icon: <CheckIcon className="w-4 h-4" />,
            variant: 'primary' as const,
            color: 'primary' as const,
            action: () => handleActionClick({ type: 'approve' })
          });
          actions.push({
            label: 'Reject',
            icon: <XMarkIcon className="w-4 h-4" />,
            variant: 'secondary' as const,
            color: 'secondary' as const,
            action: () => handleActionClick({ type: 'reject' })
          });
        }
        break;

      case 'review':
        if (isCreator) {
          actions.push({
            label: 'Mark Complete',
            icon: <CheckIcon className="w-4 h-4" />,
            variant: 'primary' as const,
            color: 'primary' as const,
            action: () => handleActionClick({ type: 'transition', targetStatus: 'done' })
          });
        }
        break;
    }

    return actions;
  }, [task.status, task.assignedTo?.id, task.createdById, currentUser.id]);

  const handleActionClick = (actionConfig: { type: string; targetStatus?: Task['status'] }) => {
    setDialog({
      open: true,
      type: actionConfig.type as TransitionDialog['type'],
      targetStatus: actionConfig.targetStatus,
      reason: '',
      comment: ''
    });
  };

  const handleDialogClose = () => {
    setDialog({
      open: false,
      type: 'transition',
      reason: '',
      comment: ''
    });
  };

  const handleSubmit = async () => {
    if (dialog.type === 'reject' && !dialog.reason.trim()) {
      onError('Rejection reason is required');
      return;
    }

    setLoading(true);
    try {
      let newStatus: Task['status'];
      
      if (dialog.type === 'transition' && dialog.targetStatus) {
        newStatus = dialog.targetStatus;
      } else if (dialog.type === 'approve') {
        newStatus = 'done';
      } else if (dialog.type === 'reject') {
        newStatus = 'in_progress'; // Return to in_progress after rejection
      } else {
        throw new Error('Invalid workflow action type');
      }

      // Call the parent component's update handler - let it handle the API call
      onTaskUpdate(task.id, { status: newStatus });
      
      handleDialogClose();
    } catch (error: any) {
      console.error('Workflow action failed:', error);
      onError(error.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !dialog.open) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Current Status Display */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Workflow Status
        </h3>
        <span className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          currentStatusConfig.color
        )}>
          <span className="mr-2">{currentStatusConfig.icon}</span>
          {currentStatusConfig.label}
        </span>
        {showHistory && (
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="View workflow history"
          >
            <ClockIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Available Actions */}
      {availableActions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                action.icon
              )}
              {action.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <InformationCircleIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            No workflow actions available for current status.
          </span>
        </div>
      )}

      {/* Action Dialog */}
      <Modal
        isOpen={dialog.open}
        onClose={handleDialogClose}
        title={
          dialog.type === 'transition' && dialog.targetStatus
            ? `Change Status to ${STATUS_CONFIG[dialog.targetStatus as keyof typeof STATUS_CONFIG]?.label}`
            : dialog.type === 'approve'
            ? 'Approve Task'
            : 'Reject Task'
        }
        showCloseButton={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
      >
        <div className="space-y-4">
          {dialog.type === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={dialog.reason}
                onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={dialog.comment}
              onChange={(e) => setDialog({ ...dialog, comment: e.target.value })}
              placeholder="Add a comment about this workflow action..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="secondary" 
            onClick={handleDialogClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmit} 
            disabled={loading || (dialog.type === 'reject' && !dialog.reason.trim())}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            Confirm
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default TaskWorkflowControls;