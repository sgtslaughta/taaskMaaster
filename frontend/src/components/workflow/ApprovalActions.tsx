/**
 * @fileoverview Approval Actions component for TaaskMaaster
 * @description Component for task approval and rejection actions
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import { TaskStatus } from '../../services/taskService';
import { WorkflowService } from '../../services/workflowService';

/**
 * @description Approval actions props interface
 */
interface ApprovalActionsProps {
  taskId: number;
  currentStatus: TaskStatus;
  isTaskCreator?: boolean;
  onApproval?: (approved: boolean, message: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * @description Approval Actions Component
 * @param props - Component props
 * @returns JSX.Element
 */
export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  taskId,
  currentStatus,
  isTaskCreator = false,
  onApproval,
  className,
  disabled = false,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApprovalComment, setShowApprovalComment] = useState(false);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Only show approval actions if task is submitted for approval and user is the task creator
  const canApprove = currentStatus === TaskStatus.SUBMITTED_FOR_APPROVAL && isTaskCreator;

  if (!canApprove) {
    return null;
  }

  /**
   * Handle approval action
   */
  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await WorkflowService.approveTask({
        task_id: taskId,
        comment: approvalComment.trim() || undefined,
      });

      onApproval?.(true, response.message);
      setShowApprovalComment(false);
      setApprovalComment('');
    } catch (err: any) {
      console.error('Error approving task:', err);
      setError(err.response?.data?.detail || 'Failed to approve task');
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Handle rejection action
   */
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const response = await WorkflowService.rejectTask({
        task_id: taskId,
        reason: rejectionReason.trim(),
      });

      onApproval?.(false, response.message);
      setShowRejectionReason(false);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error rejecting task:', err);
      setError(err.response?.data?.detail || 'Failed to reject task');
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Cancel approval comment
   */
  const handleCancelApproval = () => {
    setShowApprovalComment(false);
    setApprovalComment('');
    setError(null);
  };

  /**
   * Cancel rejection
   */
  const handleCancelRejection = () => {
    setShowRejectionReason(false);
    setRejectionReason('');
    setError(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Task Submitted for Approval Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-purple-600 text-lg">⏳</span>
          <h4 className="text-sm font-medium text-purple-900">
            Task Submitted for Approval
          </h4>
        </div>
        <p className="text-sm text-purple-700 mb-3">
          This task has been submitted for your review and approval.
        </p>

        {/* Action Buttons */}
        {!showApprovalComment && !showRejectionReason && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowApprovalComment(true)}
              disabled={disabled || isApproving || isRejecting}
              className="bg-green-600 hover:bg-green-700 border-green-600"
            >
              ✅ Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectionReason(true)}
              disabled={disabled || isApproving || isRejecting}
              className="border-red-500 text-red-700 hover:bg-red-50"
            >
              ❌ Reject
            </Button>
          </div>
        )}
      </div>

      {/* Approval Comment Form */}
      {showApprovalComment && (
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-green-900 mb-1">
              Approve Task
            </h4>
            <p className="text-sm text-green-700">
              Add an optional comment about the approval.
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="approval-comment" className="block text-sm font-medium text-gray-700 mb-1">
                Approval Comment (optional)
              </label>
              <textarea
                id="approval-comment"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="Great work! Task completed successfully."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={2}
                disabled={isApproving}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700 border-green-600"
              >
                {isApproving ? 'Approving...' : '✅ Confirm Approval'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelApproval}
                disabled={isApproving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Form */}
      {showRejectionReason && (
        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              Reject Task
            </h4>
            <p className="text-sm text-red-700">
              Please provide a reason for rejecting this task.
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain what needs to be changed or improved..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                disabled={isRejecting}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 border-red-600"
              >
                {isRejecting ? 'Rejecting...' : '❌ Confirm Rejection'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelRejection}
                disabled={isRejecting}
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
