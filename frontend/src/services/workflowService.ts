/**
 * Workflow Service
 * 
 * Handles all workflow-related API calls including status transitions,
 * approvals, rejections, and workflow history.
 */

import { apiClient } from './apiClient';
import { TaskStatus } from '../types/task';
import { TaskStatusHistory } from '../types/workflow';

export interface TransitionRequest {
  task_id: number;
  new_status: TaskStatus;
  comment?: string;
}

export interface ApprovalRequest {
  task_id: number;
  comment?: string;
  notify_assignee?: boolean;
}

export interface RejectionRequest {
  task_id: number;
  reason: string;
  comment?: string;
  notify_assignee?: boolean;
}

export interface WorkflowResponse {
  success: boolean;
  message: string;
  new_status?: TaskStatus;
  task_id: number;
  timestamp: string;
}

export interface ValidTransitionsResponse {
  task_id: number;
  current_status: TaskStatus;
  valid_transitions: TaskStatus[];
  can_approve: boolean;
  can_reject: boolean;
}

export interface StatusHistoryResponse {
  task_id: number;
  history: TaskStatusHistory[];
  total_count: number;
}

class WorkflowService {
  /**
   * Get valid status transitions for a task
   */
  async getValidTransitions(taskId: number): Promise<ValidTransitionsResponse> {
    const response = await apiClient.get(`/api/v1/workflow/transitions/${taskId}`);
    return response.data;
  }

  /**
   * Transition task to new status
   */
  async transitionTaskStatus(request: TransitionRequest): Promise<WorkflowResponse> {
    const response = await apiClient.post('/api/v1/workflow/transition', request);
    return response.data;
  }

  /**
   * Approve a task
   */
  async approveTask(request: ApprovalRequest): Promise<WorkflowResponse> {
    const response = await apiClient.post('/api/v1/workflow/approve', request);
    return response.data;
  }

  /**
   * Reject a task
   */
  async rejectTask(request: RejectionRequest): Promise<WorkflowResponse> {
    const response = await apiClient.post('/api/v1/workflow/reject', request);
    return response.data;
  }

  /**
   * Get task status history
   */
  async getTaskStatusHistory(taskId: number, limit?: number): Promise<StatusHistoryResponse> {
    const params = limit ? { limit } : {};
    const response = await apiClient.get(`/api/v1/workflow/history/${taskId}`, { params });
    return response.data;
  }

  /**
   * Bulk transition multiple tasks
   */
  async bulkTransitionTasks(requests: TransitionRequest[]): Promise<WorkflowResponse[]> {
    const response = await apiClient.post('/api/v1/workflow/bulk-transition', {
      transitions: requests
    });
    return response.data.results;
  }

  /**
   * Get workflow statistics for a project or user
   */
  async getWorkflowStats(filters?: {
    project_id?: number;
    user_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    status_distribution: Record<TaskStatus, number>;
    transition_counts: Record<string, number>;
    average_completion_time: number;
    approval_rate: number;
  }> {
    const response = await apiClient.get('/api/v1/workflow/stats', { params: filters });
    return response.data;
  }

  /**
   * Get pending approvals for current user
   */
  async getPendingApprovals(limit?: number): Promise<{
    tasks: Array<{
      id: number;
      title: string;
      assigned_user: {
        id: number;
        username: string;
        first_name?: string;
        last_name?: string;
      };
      submitted_at: string;
      priority: string;
    }>;
    total_count: number;
  }> {
    const params = limit ? { limit } : {};
    const response = await apiClient.get('/api/v1/workflow/pending-approvals', { params });
    return response.data;
  }

  /**
   * Check if user can perform workflow action
   */
  async canPerformAction(taskId: number, action: 'transition' | 'approve' | 'reject'): Promise<{
    can_perform: boolean;
    reason?: string;
  }> {
    const response = await apiClient.get(`/api/v1/workflow/permissions/${taskId}/${action}`);
    return response.data;
  }

  /**
   * Get workflow template/rules for task type
   */
  async getWorkflowRules(taskType?: string): Promise<{
    allowed_transitions: Record<TaskStatus, TaskStatus[]>;
    approval_required: TaskStatus[];
    auto_transitions: Record<TaskStatus, TaskStatus>;
    notification_settings: Record<string, boolean>;
  }> {
    const params = taskType ? { task_type: taskType } : {};
    const response = await apiClient.get('/api/v1/workflow/rules', { params });
    return response.data;
  }

  /**
   * Create custom workflow transition with validation
   */
  async createCustomTransition(request: {
    task_id: number;
    from_status: TaskStatus;
    to_status: TaskStatus;
    validation_rules?: string[];
    notification_config?: {
      notify_assignee: boolean;
      notify_creator: boolean;
      email_template?: string;
    };
  }): Promise<WorkflowResponse> {
    const response = await apiClient.post('/api/v1/workflow/custom-transition', request);
    return response.data;
  }

  /**
   * Schedule automatic status transition
   */
  async scheduleTransition(request: {
    task_id: number;
    target_status: TaskStatus;
    scheduled_at: string;
    condition?: string;
    comment?: string;
  }): Promise<{
    success: boolean;
    scheduled_transition_id: number;
    message: string;
  }> {
    const response = await apiClient.post('/api/v1/workflow/schedule-transition', request);
    return response.data;
  }

  /**
   * Cancel scheduled transition
   */
  async cancelScheduledTransition(transitionId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await apiClient.delete(`/api/v1/workflow/scheduled-transitions/${transitionId}`);
    return response.data;
  }

  /**
   * Get workflow analytics and insights
   */
  async getWorkflowAnalytics(filters?: {
    project_id?: number;
    team_id?: number;
    date_range?: string;
    status_filter?: TaskStatus[];
  }): Promise<{
    completion_trends: Array<{
      date: string;
      completed_tasks: number;
      average_time: number;
    }>;
    bottlenecks: Array<{
      status: TaskStatus;
      average_duration: number;
      task_count: number;
    }>;
    user_performance: Array<{
      user_id: number;
      username: string;
      completion_rate: number;
      average_time: number;
      tasks_completed: number;
    }>;
    status_flow: Record<string, number>;
  }> {
    const response = await apiClient.get('/api/v1/workflow/analytics', { params: filters });
    return response.data;
  }
}

export const workflowService = new WorkflowService();