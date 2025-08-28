/**
 * Common Components Index
 * 
 * Centralized exports for all common/shared components.
 */

export { default as RichTextEditor } from './RichTextEditor';
export { default as MediaUploader } from './MediaUploader';
export { default as MediaViewer } from './MediaViewer';

// Re-export types for convenience
export type {
  MediaAttachment,
  MediaMetadata,
  MediaUploadResponse,
  MediaUploadProgress,
  MediaPreview,
  MediaFolder,
  MediaTag,
  MediaShare,
  MediaComment,
  MediaVersion,
  MediaProcessingJob,
  MediaSearchFilter,
  MediaSearchResult,
  MediaStatistics,
  MediaBulkOperation,
  MediaBulkOperationResult,
  MediaWebSocketEvent,
  MediaWebSocketMessage
} from '../../types/media';
