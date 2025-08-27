/**
 * @fileoverview Workflow Service for TaaskMaaster
 * @description Service for handling workflow operations with the backend API
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import { apiGet, apiPost } from './api';
import { TaskStatus } from './taskService';

/**
 * @description Workflow transition request
 */
export interface WorkflowTransitionRequest {
  task_id: number;
  new_status: TaskStatus;
  comment?: string;
  force?: boolean;
}

/**
 * @description Workflow approval request
 */
export interface WorkflowApprovalRequest {
  task_id: number;
  comment?: string;
}

/**
 * @description Workflow rejection request
 */
export interface WorkflowRejectionRequest {
  task_id: number;
  reason: string;
}

/**
 * @description Workflow transition response
 */
export interface WorkflowTransitionResponse {
  success: boolean;
  message: string;
  task_id: number;
  previous_status: string;
  new_status: string;
  transitioned_by: number;
  comment?: string;
}

/**
 * @description Valid transitions response
 */
export interface ValidTransitionsResponse {
  task_id: number;
  current_status: TaskStatus;
  valid_transitions: TaskStatus[];
  user_id: number;
}

/**
 * @description Workflow Service Class
 * @class WorkflowService
 */
export class WorkflowService {
  /**
   * Transition a task to a new status
   * @param transitionData - Transition request data
   * @returns Promise<WorkflowTransitionResponse>
   */
  static async transitionTaskStatus(
    transitionData: WorkflowTransitionRequest
  ): Promise<WorkflowTransitionResponse> {
    try {
      const response = await apiPost('/api/v1/workflow/transition', transitionData);
      return response.data;
    } catch (error) {
      console.error('Error transitioning task status:', error);
      throw error;
    }
  }

  /**
   * Approve a task that's submitted for approval
   * @param approvalData - Approval request data
   * @returns Promise<WorkflowTransitionResponse>
   */
  static async approveTask(
    approvalData: WorkflowApprovalRequest
  ): Promise<WorkflowTransitionResponse> {
    try {
      const response = await apiPost('/api/v1/workflow/approve', approvalData);
      return response.data;
    } catch (error) {
      console.error('Error approving task:', error);
      throw error;
    }
  }

  /**
   * Reject a task that's submitted for approval
   * @param rejectionData - Rejection request data
   * @returns Promise<WorkflowTransitionResponse>
   */
  static async rejectTask(
    rejectionData: WorkflowRejectionRequest
  ): Promise<WorkflowTransitionResponse> {
    try {
      const response = await apiPost('/api/v1/workflow/reject', rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rejecting task:', error);
      throw error;
    }
  }

  /**
   * Get valid transitions for a task
   * @param taskId - Task ID
   * @returns Promise<ValidTransitionsResponse>
   */
  static async getValidTransitions(taskId: number): Promise<ValidTransitionsResponse> {
    try {
      const response = await apiGet(`/api/v1/workflow/transitions/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching valid transitions:', error);
      throw error;
    }
  }

  /**
   * Get status change history for a task
   * @param taskId - Task ID
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise<TaskStatusHistoryListResponse>
   */
  static async getTaskStatusHistory(
    taskId: number,
    skip: number = 0,
    limit: number = 100
  ): Promise<import('./commentService').TaskStatusHistoryListResponse> {
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiGet(`/api/v1/workflow/history/${taskId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task status history:', error);
      throw error;
    }
  }

  /**
   * Get user-friendly status display name
   * @param status - Task status
   * @returns string
   */
  static getStatusDisplayName(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.ASSIGNED:
        return 'Assigned';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.SUBMITTED_FOR_APPROVAL:
        return 'Submitted for Approval';
      case TaskStatus.REVIEW:
        return 'Review';
      case TaskStatus.DONE:
        return 'Done';
      case TaskStatus.CANCELLED:
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Get status color for UI display
   * @param status - Task status
   * @returns string
   */
  static getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'gray';
      case TaskStatus.ASSIGNED:
        return 'blue';
      case TaskStatus.IN_PROGRESS:
        return 'yellow';
      case TaskStatus.SUBMITTED_FOR_APPROVAL:
        return 'purple';
      case TaskStatus.REVIEW:
        return 'orange';
      case TaskStatus.DONE:
        return 'green';
      case TaskStatus.CANCELLED:
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Check if a status transition is a completion action
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns boolean
   */
  static isCompletionTransition(fromStatus: TaskStatus, toStatus: TaskStatus): boolean {
    return (
      fromStatus === TaskStatus.SUBMITTED_FOR_APPROVAL &&
      toStatus === TaskStatus.DONE
    );
  }

  /**
   * Check if a status transition is a rejection action
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns boolean
   */
  static isRejectionTransition(fromStatus: TaskStatus, toStatus: TaskStatus): boolean {
    return (
      fromStatus === TaskStatus.SUBMITTED_FOR_APPROVAL &&
      toStatus === TaskStatus.IN_PROGRESS
    );
  }
}
