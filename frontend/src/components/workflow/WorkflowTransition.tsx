/**
 * @fileoverview Workflow Transition component for TaaskMaaster
 * @description Component for managing task status transitions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { TaskStatus } from '../../services/taskService';
import { WorkflowService, ValidTransitionsResponse } from '../../services/workflowService';

/**
 * @description Workflow transition props interface
 */
interface WorkflowTransitionProps {
  taskId: number;
  currentStatus: TaskStatus;
  onTransition?: (newStatus: TaskStatus, message: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * @description Workflow Transition Component
 * @param props - Component props
 * @returns JSX.Element
 */
export const WorkflowTransition: React.FC<WorkflowTransitionProps> = ({
  taskId,
  currentStatus,
  onTransition,
  className,
  disabled = false,
}) => {
  const [validTransitions, setValidTransitions] = useState<TaskStatus[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TaskStatus | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);

  /**
   * Load valid transitions for the task
   */
  const loadValidTransitions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: ValidTransitionsResponse = await WorkflowService.getValidTransitions(taskId);
      setValidTransitions(response.valid_transitions);
    } catch (err: any) {
      console.error('Error loading valid transitions:', err);
      setError(err.response?.data?.detail || 'Failed to load valid transitions');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle transition selection
   */
  const handleTransitionSelect = (newStatus: TaskStatus) => {
    setSelectedTransition(newStatus);
    setShowCommentInput(true);
    setComment('');
  };

  /**
   * Handle transition execution
   */
  const handleTransitionExecute = async () => {
    if (!selectedTransition) return;

    setIsTransitioning(true);
    setError(null);

    try {
      const response = await WorkflowService.transitionTaskStatus({
        task_id: taskId,
        new_status: selectedTransition,
        comment: comment.trim() || undefined,
      });

      onTransition?.(selectedTransition, response.message);
      setSelectedTransition(null);
      setShowCommentInput(false);
      setComment('');
      
      // Reload valid transitions for the new status
      await loadValidTransitions();
    } catch (err: any) {
      console.error('Error executing transition:', err);
      setError(err.response?.data?.detail || 'Failed to transition task status');
    } finally {
      setIsTransitioning(false);
    }
  };

  /**
   * Cancel transition
   */
  const handleTransitionCancel = () => {
    setSelectedTransition(null);
    setShowCommentInput(false);
    setComment('');
    setError(null);
  };

  /**
   * Get transition button variant based on status
   */
  const getTransitionButtonVariant = (status: TaskStatus): 'primary' | 'secondary' | 'outline' | 'ghost' => {
    switch (status) {
      case TaskStatus.ASSIGNED:
        return 'primary';
      case TaskStatus.IN_PROGRESS:
        return 'secondary';
      case TaskStatus.SUBMITTED_FOR_APPROVAL:
        return 'primary';
      case TaskStatus.DONE:
        return 'primary';
      case TaskStatus.CANCELLED:
        return 'outline';
      default:
        return 'outline';
    }
  };

  /**
   * Get transition button color class
   */
  const getTransitionButtonColor = (status: TaskStatus): string => {
    const color = WorkflowService.getStatusColor(status);
    return `border-${color}-500 text-${color}-700 hover:bg-${color}-50`;
  };

  /**
   * Load valid transitions on mount and when currentStatus changes
   */
  useEffect(() => {
    loadValidTransitions();
  }, [taskId, currentStatus]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading transitions...</span>
      </div>
    );
  }

  if (error && !validTransitions.length) {
    return (
      <div className={cn('text-sm text-red-600', className)}>
        {error}
      </div>
    );
  }

  if (validTransitions.length === 0) {
    return (
      <div className={cn('text-sm text-gray-500', className)}>
        No transitions available
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Current Status Display */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Current status:</span>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            `bg-${WorkflowService.getStatusColor(currentStatus)}-100`,
            `text-${WorkflowService.getStatusColor(currentStatus)}-800`
          )}
        >
          {WorkflowService.getStatusDisplayName(currentStatus)}
        </span>
      </div>

      {/* Transition Buttons */}
      {!showCommentInput && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 mr-2">Transition to:</span>
          {validTransitions.map((status) => (
            <Button
              key={status}
              variant={getTransitionButtonVariant(status)}
              size="sm"
              onClick={() => handleTransitionSelect(status)}
              disabled={disabled || isTransitioning}
              className={cn(
                'text-xs',
                getTransitionButtonColor(status)
              )}
            >
              {WorkflowService.getStatusDisplayName(status)}
            </Button>
          ))}
        </div>
      )}

      {/* Comment Input for Transition */}
      {showCommentInput && selectedTransition && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-900">
              Transitioning to: {WorkflowService.getStatusDisplayName(selectedTransition)}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="transition-comment" className="block text-sm font-medium text-gray-700 mb-1">
                Comment (optional)
              </label>
              <textarea
                id="transition-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment about this transition..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                disabled={isTransitioning}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleTransitionExecute}
                disabled={isTransitioning}
              >
                {isTransitioning ? 'Transitioning...' : 'Confirm Transition'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTransitionCancel}
                disabled={isTransitioning}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
