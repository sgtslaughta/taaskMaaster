/**
 * SimpleTaskComments Component
 * 
 * A simplified task comments interface using the TaaskMaaster design system
 * instead of Material-UI. Provides basic commenting functionality with
 * real-time updates and a clean chat-like interface.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { cn } from '../../design-system/utils/cn';
import { User } from '../../types/user';
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ReplyIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { commentService, Comment } from '../../services/commentService';
import { useWebSocket } from '../../hooks/useWebSocket';

// Comment interface is now imported from commentService

interface SimpleTaskCommentsProps {
  taskId: number;
  currentUser: User;
  maxHeight?: number;
  allowRichText?: boolean;
  allowMediaUpload?: boolean;
  showTypingIndicators?: boolean;
  autoScrollToBottom?: boolean;
}

const SimpleTaskComments: React.FC<SimpleTaskCommentsProps> = ({
  taskId,
  currentUser,
  maxHeight = 300,
  allowRichText = true,
  allowMediaUpload = true,
  showTypingIndicators = true,
  autoScrollToBottom = true
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebSocket for real-time updates (notifications)
  const notificationWS = useWebSocket({
    url: 'ws://localhost:8000/ws/notifications',
    autoConnect: true
  });

  // WebSocket for messaging (typing indicators)
  const messagingWS = useWebSocket({
    url: 'ws://localhost:8000/ws/messaging',
    autoConnect: true
  });

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (autoScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScrollToBottom]);

  // Load comments on mount
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await commentService.getTaskComments(taskId, {
          limit: 100,
          include_system: false
        });
        
        setComments(response.comments);
      } catch (err: any) {
        console.error('Failed to load comments:', err);
        setError(err.detail || 'Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [taskId]);

  // Scroll to bottom when comments change
  useEffect(() => {
    scrollToBottom();
  }, [comments, scrollToBottom]);

  // Subscribe to real-time comment updates (notifications WebSocket)
  useEffect(() => {
    if (!notificationWS.subscribe) return;

    const unsubscribeNewComment = notificationWS.subscribe('task_comment', (data: any) => {
      console.log('🔔 Received task_comment notification:', data);
      // The backend sends the full notification structure, extract comment data
      if (data.task_id === taskId) {
        console.log('✅ Notification is for current task, reloading comments...');
        // Since we get a notification, we need to reload comments or extract comment from data
        // For now, let's reload to get the latest comments
        const loadComments = async () => {
          try {
            const response = await commentService.getTaskComments(taskId, {
              limit: 100,
              include_system: false
            });
            console.log('📝 Reloaded comments after notification:', response.comments.length, 'comments');
            setComments(response.comments);
          } catch (err) {
            console.error('Failed to reload comments after notification:', err);
          }
        };
        loadComments();
      } else {
        console.log('ℹ️ Notification is for different task:', data.task_id, 'vs current:', taskId);
      }
    });

    // TODO: Add handlers for comment_updated and comment_deleted when backend implements them
    const unsubscribeUpdateComment = notificationWS.subscribe('comment_updated', (data: Comment) => {
      if (data.task_id === taskId) {
        setComments(prev => prev.map(c => c.id === data.id ? data : c));
      }
    });

    const unsubscribeDeleteComment = notificationWS.subscribe('comment_deleted', (data: { id: number; task_id: number }) => {
      if (data.task_id === taskId) {
        setComments(prev => prev.filter(c => c.id !== data.id));
      }
    });

    return () => {
      unsubscribeNewComment();
      unsubscribeUpdateComment();
      unsubscribeDeleteComment();
    };
  }, [taskId, notificationWS.subscribe]);

  // Subscribe to typing indicators (messaging WebSocket)
  useEffect(() => {
    if (!messagingWS.subscribe) return;

    const unsubscribeTyping = messagingWS.subscribe('typing_indicator', (data: any) => {
      console.log('⌨️ Received typing indicator:', data);
      
      // Check if this typing indicator is for the current task
      if (data.context?.type === 'task_chat' && data.context?.context_id === taskId) {
        const username = data.user?.username;
        if (username && username !== currentUser.username) {
          if (data.is_typing) {
            setTypingUsers(prev => new Set([...prev, username]));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(username);
              return newSet;
            });
          }
        }
      }
    });

    return () => {
      unsubscribeTyping();
    };
  }, [taskId, currentUser.username, messagingWS.subscribe]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (messagingWS.sendMessage) {
      messagingWS.sendMessage({
        type: 'typing_indicator',
        data: {
          context_type: 'task_chat',
          context_id: taskId,
          is_typing: isTyping
        }
      });
    }
  }, [messagingWS.sendMessage, taskId]);

  // Handle input change with typing indicators
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Send typing indicator when user starts typing
    if (value.trim() && !sending) {
      sendTypingIndicator(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else if (!value.trim()) {
      // Stop typing indicator when input is empty
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [sending, sendTypingIndicator]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Send stop typing indicator when component unmounts
      sendTypingIndicator(false);
    };
  }, [sendTypingIndicator]);

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      
      // Stop typing indicator when sending
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      const commentData = {
        task_id: taskId,
        content: newComment,
        content_type: 'text' as const,
        parent_comment_id: replyingTo || undefined
      };
      
      const createdComment = await commentService.createComment(commentData);
      
      // Don't add to local state immediately - let WebSocket handle it
      // This prevents duplicate comments when real-time updates work
      if (!notificationWS.isConnected) {
        // Only add locally if WebSocket is not connected
        setComments(prev => [...prev, createdComment]);
      }
      
      setNewComment('');
      setReplyingTo(null);
      
      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err: any) {
      console.error('Failed to send comment:', err);
      setError(err.detail || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = comment.user.id === currentUser.id;
    
    return (
      <div
        key={comment.id}
        className={cn(
          "flex gap-3 mb-4",
          isReply && "ml-8",
          isOwnComment ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.user.username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex-1 max-w-xs md:max-w-md",
          isOwnComment && "text-right"
        )}>
          <div className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isOwnComment 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          )}>
            {!isOwnComment && (
              <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                {comment.user.username}
              </div>
            )}
            <div>{comment.content}</div>
          </div>
          
          {/* Timestamp */}
          <div className={cn(
            "text-xs text-gray-500 mt-1",
            isOwnComment ? "text-right" : "text-left"
          )}>
            {formatMessageTime(comment.created_at)}
          </div>

          {/* Action buttons */}
          <div className={cn(
            "flex gap-2 mt-1",
            isOwnComment ? "justify-end" : "justify-start"
          )}>
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-gray-500 hover:text-blue-500"
            >
              Reply
            </button>
            {isOwnComment && (
              <>
                <button
                  onClick={() => setEditingComment(comment.id)}
                  className="text-xs text-gray-500 hover:text-blue-500"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      setError(err.detail || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Discussion ({comments.length})
          </h3>
          {/* Connection status indicators */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              notificationWS.isConnected ? "bg-green-500" : "bg-gray-400"
            )} 
            title={notificationWS.isConnected ? "Notifications connected" : "Notifications disconnected"}
            />
            <div className={cn(
              "w-2 h-2 rounded-full",
              messagingWS.isConnected ? "bg-blue-500" : "bg-gray-400"
            )} 
            title={messagingWS.isConnected ? "Typing indicators connected" : "Typing indicators disconnected"}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="p-1"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
          <Input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments
            .filter(comment => 
              !searchQuery || 
              comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              comment.user.username.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(comment => renderComment(comment))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Replying to comment...
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Typing Indicators */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a comment..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              disabled={sending}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {allowMediaUpload && (
              <Button variant="ghost" size="sm" className="p-2">
                <PaperClipIcon className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="p-2">
              <FaceSmileIcon className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSendComment}
              disabled={!newComment.trim() || sending}
              className="p-2"
              size="sm"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTaskComments;
