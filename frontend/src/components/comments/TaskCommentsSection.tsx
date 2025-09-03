/**
 * TaskCommentsSection Component
 * 
 * SMS-like comment interface for task discussions with real-time updates,
 * media attachments, and rich text support.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  Skeleton,
  Fade,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

import { TaskComment } from '../../types/comment';
import { User } from '../../types/user';
import { MediaAttachment } from '../../types/media';
import { commentService } from '../../services/commentService';
import { mediaService } from '../../services/mediaService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { RichTextEditor } from '../common/RichTextEditor';
import { MediaUploader } from '../common/MediaUploader';
import { MediaViewer } from '../common/MediaViewer';
import { SearchFilterPanel } from '../common/SearchFilterPanel';
import { useSearch } from '../../hooks/useSearch';

interface TaskCommentsSectionProps {
  taskId: number;
  currentUser: User;
  maxHeight?: string | number;
  allowRichText?: boolean;
  allowMediaUpload?: boolean;
  showTypingIndicators?: boolean;
  autoScrollToBottom?: boolean;
}

interface CommentWithReplies extends TaskComment {
  replies?: TaskComment[];
  isEditing?: boolean;
  showReplies?: boolean;
}

const TaskCommentsSection: React.FC<TaskCommentsSectionProps> = ({
  taskId,
  currentUser,
  maxHeight = 400,
  allowRichText = true,
  allowMediaUpload = true,
  showTypingIndicators = true,
  autoScrollToBottom = true
}) => {
  const theme = useTheme();
  const { subscribe, unsubscribe, send } = useWebSocket();
  
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // Search functionality
  const search = useSearch({
    scope: 'comments',
    taskId: taskId,
    pageSize: 20
  });
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (autoScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScrollToBottom]);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [taskId]);

  // WebSocket event subscriptions
  useEffect(() => {
    const handleNewComment = (data: any) => {
      if (data.task_id === taskId) {
        setComments(prev => [...prev, data.comment]);
        scrollToBottom();
      }
    };

    const handleCommentUpdated = (data: any) => {
      if (data.task_id === taskId) {
        setComments(prev => prev.map(comment => 
          comment.id === data.comment.id ? { ...comment, ...data.comment } : comment
        ));
      }
    };

    const handleCommentDeleted = (data: any) => {
      if (data.task_id === taskId) {
        setComments(prev => prev.filter(comment => comment.id !== data.comment_id));
      }
    };

    const handleTypingUpdate = (data: any) => {
      if (data.task_id === taskId && showTypingIndicators) {
        setTypingUsers(data.typing_users.filter((user: User) => user.id !== currentUser.id));
      }
    };

    subscribe('comment_created', handleNewComment);
    subscribe('comment_updated', handleCommentUpdated);
    subscribe('comment_deleted', handleCommentDeleted);
    subscribe('user_typing', handleTypingUpdate);

    return () => {
      unsubscribe('comment_created', handleNewComment);
      unsubscribe('comment_updated', handleCommentUpdated);
      unsubscribe('comment_deleted', handleCommentDeleted);
      unsubscribe('user_typing', handleTypingUpdate);
    };
  }, [taskId, currentUser.id, showTypingIndicators, subscribe, unsubscribe, scrollToBottom]);

  // Auto-scroll when new comments arrive
  useEffect(() => {
    scrollToBottom();
  }, [comments.length, scrollToBottom]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getTaskComments(taskId, {
        include_replies: true,
        include_media: true,
        sort_by: 'created_at',
        sort_order: 'asc'
      });
      
      setComments(response.comments.map(comment => ({
        ...comment,
        showReplies: true
      })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && selectedMedia.length === 0) return;

    try {
      let mediaAttachments: MediaAttachment[] = [];
      
      // Upload media files if any
      if (selectedMedia.length > 0) {
        const uploadPromises = selectedMedia.map(file => 
          mediaService.uploadMedia(file, 'comment')
        );
        const uploadResults = await Promise.all(uploadPromises);
        mediaAttachments = uploadResults.map(result => result.media);
      }

      const commentData = {
        task_id: taskId,
        content: newComment.trim(),
        parent_comment_id: replyingTo,
        media_attachments: mediaAttachments.map(media => media.id)
      };

      await commentService.createTaskComment(commentData);
      
      // Clear form
      setNewComment('');
      setSelectedMedia([]);
      setReplyingTo(null);
      
      // Send typing stopped event
      send({
        type: 'typing_stopped',
        task_id: taskId,
        user_id: currentUser.id
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send comment');
    }
  };

  const handleEditComment = async (commentId: number, newContent: string) => {
    try {
      await commentService.updateTaskComment(commentId, {
        content: newContent
      });
      setEditingComment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteTaskComment(commentId);
      setAnchorEl(null);
      setSelectedCommentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const handleInputChange = (value: string) => {
    setNewComment(value);
    
    // Send typing indicator
    if (showTypingIndicators && value.trim()) {
      send({
        type: 'typing_started',
        task_id: taskId,
        user_id: currentUser.id
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to send typing stopped
      typingTimeoutRef.current = setTimeout(() => {
        send({
          type: 'typing_stopped',
          task_id: taskId,
          user_id: currentUser.id
        });
      }, 3000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendComment();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getMediaIcon = (mediaType: string) => {
    if (mediaType.startsWith('image/')) return <ImageIcon />;
    if (mediaType.startsWith('video/')) return <VideoIcon />;
    if (mediaType.startsWith('audio/')) return <AudioIcon />;
    return <FileIcon />;
  };

  const renderComment = (comment: CommentWithReplies, isReply = false) => {
    const isOwnComment = comment.user_id === currentUser.id;
    const isSystemComment = comment.is_system_generated;

    return (
      <Box
        key={comment.id}
        sx={{
          display: 'flex',
          justifyContent: isOwnComment ? 'flex-end' : 'flex-start',
          mb: 1,
          ml: isReply ? 4 : 0
        }}
      >
        {!isOwnComment && !isSystemComment && (
          <Avatar
            sx={{ width: 32, height: 32, mr: 1 }}
            src={comment.user?.avatar}
          >
            {comment.user?.firstName?.[0] || comment.user?.username[0]}
          </Avatar>
        )}

        <Paper
          elevation={1}
          sx={{
            maxWidth: '70%',
            minWidth: 120,
            p: 1.5,
            bgcolor: isSystemComment 
              ? 'grey.100' 
              : isOwnComment 
                ? theme.palette.primary.main 
                : 'background.paper',
            color: isOwnComment ? 'white' : 'text.primary',
            borderRadius: isOwnComment ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            position: 'relative'
          }}
        >
          {/* Comment Header */}
          {!isSystemComment && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600,
                  opacity: isOwnComment ? 0.9 : 0.7
                }}
              >
                {isOwnComment ? 'You' : comment.user?.firstName || comment.user?.username}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography 
                  variant="caption" 
                  sx={{ opacity: isOwnComment ? 0.8 : 0.6 }}
                >
                  {formatMessageTime(comment.created_at)}
                </Typography>
                
                {isOwnComment && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedCommentId(comment.id);
                    }}
                    sx={{ 
                      color: 'inherit', 
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}

          {/* Comment Content */}
          {editingComment === comment.id ? (
            <TextField
              multiline
              fullWidth
              size="small"
              defaultValue={comment.content}
              onBlur={(e) => handleEditComment(comment.id, e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleEditComment(comment.id, e.currentTarget.value);
                }
              }}
              autoFocus
            />
          ) : (
            <Typography 
              variant="body2"
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {comment.content}
            </Typography>
          )}

          {/* Media Attachments */}
          {comment.media_attachments && comment.media_attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {comment.media_attachments.map((media, index) => (
                <Chip
                  key={index}
                  icon={getMediaIcon(media.mime_type)}
                  label={media.filename}
                  size="small"
                  onClick={() => mediaService.downloadMedia(media.id)}
                  sx={{ 
                    mr: 0.5, 
                    mb: 0.5,
                    bgcolor: isOwnComment ? 'rgba(255,255,255,0.2)' : 'action.hover'
                  }}
                />
              ))}
            </Box>
          )}

          {/* Reply Button */}
          {!isSystemComment && !isReply && (
            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={() => setReplyingTo(comment.id)}
                sx={{ 
                  color: 'inherit', 
                  opacity: 0.6,
                  '&:hover': { opacity: 1 }
                }}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Paper>

        {isOwnComment && !isSystemComment && (
          <Avatar
            sx={{ width: 32, height: 32, ml: 1 }}
            src={currentUser.avatar}
          >
            {currentUser.firstName?.[0] || currentUser.username[0]}
          </Avatar>
        )}
      </Box>
    );
  };

  const renderTypingIndicators = () => {
    if (!showTypingIndicators || typingUsers.length === 0) return null;

    return (
      <Fade in={true}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, opacity: 0.7 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
            {typingUsers[0].firstName?.[0] || typingUsers[0].username[0]}
          </Avatar>
          <Typography variant="caption">
            {typingUsers.length === 1 
              ? `${typingUsers[0].firstName || typingUsers[0].username} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </Typography>
          <Box sx={{ ml: 1, display: 'flex', gap: 0.2 }}>
            {[0, 1, 2].map(i => (
              <Box
                key={i}
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </Box>
        </Box>
      </Fade>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={32} height={32} />
            <Box sx={{ ml: 1, flex: 1 }}>
              <Skeleton variant="rectangular" height={60} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Comments ({showSearch ? search.results.totalCount : comments.length})
          </Typography>
          <IconButton onClick={() => setShowSearch(!showSearch)}>
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search Panel */}
      {showSearch && (
        <SearchFilterPanel
          filters={search.filters}
          onFiltersChange={search.setFilters}
          availableUsers={search.filterOptions.users}
          availableContentTypes={search.filterOptions.contentTypes}
          availableTags={search.filterOptions.tags}
          compact
          searchPlaceholder="Search comments..."
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Messages Container */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          maxHeight,
          p: 1
        }}
      >
        {showSearch ? (
          // Show search results
          search.results.comments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                {search.loading ? 'Searching...' : 'No comments found matching your search.'}
              </Typography>
            </Box>
          ) : (
            search.results.comments.map(comment => (
              <Box key={comment.id}>
                {renderComment(comment)}
              </Box>
            ))
          )
        ) : (
          // Show regular comments
          comments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No comments yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            comments.map(comment => (
              <Box key={comment.id}>
                {renderComment(comment)}
                {comment.replies?.map(reply => renderComment(reply, true))}
              </Box>
            ))
          )
        )}

        {renderTypingIndicators()}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Indicator */}
      {replyingTo && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="textSecondary">
            Replying to comment...
            <IconButton 
              size="small" 
              onClick={() => setReplyingTo(null)}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Typography>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          {allowMediaUpload && (
            <MediaUploader
              onFilesSelected={setSelectedMedia}
              maxFiles={5}
              acceptedTypes={['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx']}
            >
              <IconButton size="small" color="primary">
                <AttachIcon />
              </IconButton>
            </MediaUploader>
          )}

          <TextField
            ref={inputRef}
            multiline
            maxRows={4}
            fullWidth
            size="small"
            placeholder="Type a comment..."
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px'
              }
            }}
          />

          <IconButton
            color="primary"
            onClick={handleSendComment}
            disabled={!newComment.trim() && selectedMedia.length === 0}
          >
            <SendIcon />
          </IconButton>
        </Box>

        {/* Selected Media Preview */}
        {selectedMedia.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedMedia.map((file, index) => (
              <Chip
                key={index}
                icon={getMediaIcon(file.type)}
                label={file.name}
                onDelete={() => setSelectedMedia(prev => prev.filter((_, i) => i !== index))}
                size="small"
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Comment Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setEditingComment(selectedCommentId);
          setAnchorEl(null);
        }}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => selectedCommentId && handleDeleteComment(selectedCommentId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskCommentsSection;
