/**
 * Comments Components Index
 * 
 * Centralized exports for all comment-related components.
 */

export { default as TaskCommentsSection } from './TaskCommentsSection';

// Re-export types for convenience
export type {
  TaskComment,
  CommentReaction,
  CommentMention,
  CommentThread,
  CommentDraft,
  CommentNotification,
  CommentSearch,
  CommentSearchResult,
  CommentStatistics,
  CommentWebSocketEvent,
  CommentWebSocketMessage
} from '../../types/comment';

export type {
  CreateCommentRequest,
  UpdateCommentRequest,
  CommentFilters,
  CommentQueryParams,
  CommentsResponse,
  CommentResponse,
  CommentThreadResponse
} from '../../services/commentService';