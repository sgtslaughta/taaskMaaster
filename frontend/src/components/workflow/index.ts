/**
 * Workflow Components Index
 * 
 * Centralized exports for all workflow-related components.
 */

export { default as TaskWorkflowControls } from './TaskWorkflowControls';
export { default as StatusHistoryTimeline } from './StatusHistoryTimeline';
export { default as WorkflowProgressIndicator } from './WorkflowProgressIndicator';
export { default as ApprovalDialog } from './ApprovalDialog';

// Re-export types for convenience
export type {
  TransitionRequest,
  ApprovalRequest,
  RejectionRequest,
  WorkflowResponse,
  ValidTransitionsResponse,
  StatusHistoryResponse
} from '../../services/workflowService';

export type {
  TaskStatusHistory,
  WorkflowTransition,
  WorkflowRule,
  WorkflowEvent,
  WorkflowStats,
  WorkflowWebSocketEvent,
  WorkflowWebSocketMessage
} from '../../types/workflow';