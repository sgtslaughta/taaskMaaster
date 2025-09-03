/**
 * TaskChatSection Component
 * 
 * Task-specific chat interface that allows team members to discuss
 * task details in real-time with context awareness.
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
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tooltip,
  Alert,
  Skeleton,
  Fade,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  PushPin as PinIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as FileIcon,
  Group as GroupIcon,
  Notifications as NotifyIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

import { TaskChatMessage } from '../../types/messaging';
import { Task } from '../../types/task';
import { User } from '../../types/user';
import { MediaAttachment } from '../../types/media';
import { messagingService } from '../../services/messagingService';
import { mediaService } from '../../services/mediaService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MediaUploader } from '../common/MediaUploader';

interface TaskChatSectionProps {
  task: Task;
  currentUser: User;
  maxHeight?: string | number;
  showParticipants?: boolean;
  allowMediaUpload?: boolean;
  showTypingIndicators?: boolean;
  autoScrollToBottom?: boolean;
}

interface ChatMessageWithActions extends TaskChatMessage {
  isEditing?: boolean;
  isPinned?: boolean;
  mentionedUsers?: User[];
}

const TaskChatSection: React.FC<TaskChatSectionProps> = ({
  task,
  currentUser,
  maxHeight = 500,
  showParticipants = true,
  allowMediaUpload = true,
  showTypingIndicators = true,
  autoScrollToBottom = true
}) => {
  const theme = useTheme();
  const { subscribe, unsubscribe, send, isConnected } = useWebSocket();
  
  const [messages, setMessages] = useState<ChatMessageWithActions[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (autoScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScrollToBottom]);

  // Load chat data on mount
  useEffect(() => {
    loadTaskChat();
    loadParticipants();
  }, [task.id]);

  // Periodic message polling for synchronization
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await messagingService.getTaskChatMessages(task.id, {
          include_media: true,
          include_mentions: true,
          sort_by: 'created_at',
          sort_order: 'asc'
        });
        
        // Update messages, avoiding duplicates
        setMessages(prev => {
          // Create a map of existing message IDs for deduplication
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = response.messages.filter(msg => !existingIds.has(msg.id));
          
          // Only update if there are new messages
          if (newMessages.length > 0) {
            return [...prev, ...newMessages];
          }
          
          return prev;
        });
      } catch (err) {
        console.warn('Failed to poll task chat messages:', err);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [task.id]);

  // WebSocket event subscriptions
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.task_id === task.id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data.task_id === task.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.message.id ? { ...msg, ...data.message } : msg
        ));
      }
    };

    const handleMessageDeleted = (data: any) => {
      if (data.task_id === task.id) {
        setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
      }
    };

    const handleTypingUpdate = (data: any) => {
      if (data.task_id === task.id && showTypingIndicators) {
        setTypingUsers(data.typing_users.filter((user: User) => user.id !== currentUser.id));
      }
    };

    const handleParticipantJoined = (data: any) => {
      if (data.task_id === task.id) {
        setParticipants(prev => [...prev, data.user]);
      }
    };

    const handleParticipantLeft = (data: any) => {
      if (data.task_id === task.id) {
        setParticipants(prev => prev.filter(p => p.id !== data.user_id));
      }
    };

    subscribe('task_message_created', handleNewMessage);
    subscribe('task_message_updated', handleMessageUpdated);
    subscribe('task_message_deleted', handleMessageDeleted);
    subscribe('user_typing_task', handleTypingUpdate);
    subscribe('task_participant_joined', handleParticipantJoined);
    subscribe('task_participant_left', handleParticipantLeft);

    return () => {
      unsubscribe('task_message_created', handleNewMessage);
      unsubscribe('task_message_updated', handleMessageUpdated);
      unsubscribe('task_message_deleted', handleMessageDeleted);
      unsubscribe('user_typing_task', handleTypingUpdate);
      unsubscribe('task_participant_joined', handleParticipantJoined);
      unsubscribe('task_participant_left', handleParticipantLeft);
    };
  }, [task.id, currentUser.id, showTypingIndicators, subscribe, unsubscribe, scrollToBottom]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const loadTaskChat = async () => {
    try {
      setLoading(true);
      const response = await messagingService.getTaskChatMessages(task.id, {
        include_media: true,
        include_mentions: true,
        sort_by: 'created_at',
        sort_order: 'asc'
      });
      
      setMessages(response.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await messagingService.getTaskChatParticipants(task.id);
      setParticipants(response.participants);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedMedia.length === 0) return;

    const messageContent = newMessage.trim();
    const tempId = Date.now(); // Temporary ID for optimistic update

    try {
      let mediaAttachments: MediaAttachment[] = [];
      
      // Upload media files if any
      if (selectedMedia.length > 0) {
        const uploadPromises = selectedMedia.map(file => 
          mediaService.uploadMedia(file, 'task_message')
        );
        const uploadResults = await Promise.all(uploadPromises);
        mediaAttachments = uploadResults.map(result => result.media);
      }

      // Extract mentions from message content
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(messageContent)) !== null) {
        const mentionedUser = participants.find(p => p.username === match[1]);
        if (mentionedUser) {
          mentions.push(mentionedUser.id);
        }
      }

      // Create optimistic message for immediate UI update
      const optimisticMessage: ChatMessageWithActions = {
        id: tempId,
        task_id: task.id,
        sender_id: currentUser.id,
        sender: currentUser,
        content: messageContent,
        media_attachments: mediaAttachments,
        reply_to_message_id: replyingTo,
        mentioned_users: mentions.map(id => participants.find(p => p.id === id)).filter(Boolean) as User[],
        is_pinned: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Immediately add message to UI for instant feedback
      setMessages(prev => [...prev, optimisticMessage]);

      // Clear form immediately for better UX
      setNewMessage('');
      setSelectedMedia([]);
      setReplyingTo(null);
      setShowMentions(false);

      const messageData = {
        task_id: task.id,
        content: messageContent,
        reply_to_message_id: replyingTo,
        media_attachments: mediaAttachments.map(media => media.id),
        mentioned_user_ids: mentions
      };

      const sentMessage = await messagingService.sendTaskChatMessage(messageData);
      
      // Replace optimistic message with real message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? sentMessage : msg
      ));
      
      // Send typing stopped event
      send({
        type: 'typing_stopped_task',
        task_id: task.id,
        user_id: currentUser.id
      });

    } catch (err) {
      // Remove failed message from UI
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Restore form content on failure
      setNewMessage(messageContent);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      await messagingService.updateTaskChatMessage(messageId, {
        content: newContent
      });
      setEditingMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messagingService.deleteTaskChatMessage(messageId);
      setAnchorEl(null);
      setSelectedMessageId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const handlePinMessage = async (messageId: number) => {
    try {
      await messagingService.pinTaskChatMessage(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPinned: true } : msg
      ));
      setAnchorEl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin message');
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Handle @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setMentionSuggestions(participants.filter(p => p.id !== currentUser.id));
      setShowMentions(true);
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1);
      if (searchTerm && !searchTerm.includes(' ')) {
        const filtered = participants.filter(p => 
          p.id !== currentUser.id && 
          p.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setMentionSuggestions(filtered);
        setShowMentions(filtered.length > 0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    // Send typing indicator
    if (showTypingIndicators && value.trim()) {
      send({
        type: 'typing_started_task',
        task_id: task.id,
        user_id: currentUser.id
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to send typing stopped
      typingTimeoutRef.current = setTimeout(() => {
        send({
          type: 'typing_stopped_task',
          task_id: task.id,
          user_id: currentUser.id
        });
      }, 3000);
    }
  };

  const handleMentionSelect = (user: User) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    const beforeMention = newMessage.substring(0, lastAtIndex);
    const afterMention = newMessage.substring(newMessage.length);
    setNewMessage(`${beforeMention}@${user.username} ${afterMention}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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

  const renderMessage = (message: ChatMessageWithActions) => {
    const isOwnMessage = message.sender_id === currentUser.id;
    const sender = message.sender;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 1,
          position: 'relative'
        }}
      >
        {!isOwnMessage && (
          <Avatar
            sx={{ width: 32, height: 32, mr: 1 }}
            src={sender?.avatar}
          >
            {sender?.firstName?.[0] || sender?.username[0]}
          </Avatar>
        )}

        <Paper
          elevation={1}
          sx={{
            maxWidth: '70%',
            minWidth: 120,
            p: 1.5,
            bgcolor: isOwnMessage ? theme.palette.primary.main : 'background.paper',
            color: isOwnMessage ? 'white' : 'text.primary',
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            position: 'relative'
          }}
        >
          {/* Pin indicator */}
          {message.isPinned && (
            <Tooltip title="Pinned message">
              <PinIcon 
                sx={{ 
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  fontSize: 16,
                  color: theme.palette.warning.main
                }} 
              />
            </Tooltip>
          )}

          {/* Reply indicator */}
          {message.reply_to_message_id && (
            <Box sx={{ 
              mb: 1, 
              p: 0.5, 
              bgcolor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'action.hover',
              borderRadius: 1,
              borderLeft: 3,
              borderColor: 'primary.main'
            }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Replying to message...
              </Typography>
            </Box>
          )}

          {/* Message Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600,
                opacity: isOwnMessage ? 0.9 : 0.7
              }}
            >
              {isOwnMessage ? 'You' : sender?.firstName || sender?.username}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ opacity: isOwnMessage ? 0.8 : 0.6 }}
              >
                {formatMessageTime(message.created_at)}
              </Typography>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  setAnchorEl(e.currentTarget);
                  setSelectedMessageId(message.id);
                }}
                sx={{ 
                  color: 'inherit', 
                  opacity: 0.7,
                  '&:hover': { opacity: 1 }
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Message Content */}
          {editingMessage === message.id ? (
            <TextField
              multiline
              fullWidth
              size="small"
              defaultValue={message.content}
              onBlur={(e) => handleEditMessage(message.id, e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleEditMessage(message.id, e.currentTarget.value);
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
              {/* Render mentions with highlighting */}
              {message.content.split(/(@\w+)/).map((part, index) => 
                part.startsWith('@') ? (
                  <Chip
                    key={index}
                    label={part}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      height: 20,
                      bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'primary.light',
                      color: isOwnMessage ? 'inherit' : 'primary.contrastText'
                    }}
                  />
                ) : part
              )}
            </Typography>
          )}

          {/* Media Attachments */}
          {message.media_attachments && message.media_attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {message.media_attachments.map((media, index) => (
                <Chip
                  key={index}
                  icon={getMediaIcon(media.mime_type)}
                  label={media.filename}
                  size="small"
                  onClick={() => mediaService.downloadMedia(media.id)}
                  sx={{ 
                    mr: 0.5, 
                    mb: 0.5,
                    bgcolor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'action.hover'
                  }}
                />
              ))}
            </Box>
          )}

          {/* Reply Button */}
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton
              size="small"
              onClick={() => setReplyingTo(message.id)}
              sx={{ 
                color: 'inherit', 
                opacity: 0.6,
                '&:hover': { opacity: 1 }
              }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>

        {isOwnMessage && (
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

  const renderParticipants = () => {
    if (!showParticipants) return null;

    return (
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <GroupIcon fontSize="small" />
          <Typography variant="subtitle2">
            Participants ({participants.length})
          </Typography>
          {!isConnected && (
            <Chip size="small" label="Offline" color="error" variant="outlined" />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {participants.map((participant) => (
            <Tooltip
              key={participant.id}
              title={`${participant.firstName} ${participant.lastName}`.trim() || participant.username}
            >
              <Badge
                color="success"
                variant="dot"
                invisible={!participant.is_online}
              >
                <Avatar
                  sx={{ width: 32, height: 32 }}
                  src={participant.avatar}
                >
                  {participant.firstName?.[0] || participant.username[0]}
                </Avatar>
              </Badge>
            </Tooltip>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
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
        <Typography variant="h6">
          Task Discussion
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {task.title}
        </Typography>
      </Box>

      {/* Participants */}
      {renderParticipants()}

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
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">
              No messages yet. Start the discussion!
            </Typography>
          </Box>
        ) : (
          messages.map(renderMessage)
        )}

        {renderTypingIndicators()}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Indicator */}
      {replyingTo && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="textSecondary">
            Replying to message...
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

      {/* Mention Suggestions */}
      {showMentions && (
        <Box sx={{ mx: 2, mb: 1 }}>
          <Paper elevation={2} sx={{ maxHeight: 150, overflow: 'auto' }}>
            <List dense>
              {mentionSuggestions.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleMentionSelect(user)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 24, height: 24 }} src={user.avatar}>
                      {user.firstName?.[0] || user.username[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`@${user.username}`}
                    secondary={`${user.firstName} ${user.lastName}`.trim()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
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
            placeholder="Type a message... Use @username to mention someone"
            value={newMessage}
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
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && selectedMedia.length === 0}
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

      {/* Message Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setReplyingTo(selectedMessageId);
          setAnchorEl(null);
        }}>
          <ReplyIcon sx={{ mr: 1 }} fontSize="small" />
          Reply
        </MenuItem>
        <MenuItem onClick={() => selectedMessageId && handlePinMessage(selectedMessageId)}>
          <PinIcon sx={{ mr: 1 }} fontSize="small" />
          Pin Message
        </MenuItem>
        {messages.find(m => m.id === selectedMessageId)?.sender_id === currentUser.id && (
          <>
            <MenuItem onClick={() => {
              setEditingMessage(selectedMessageId);
              setAnchorEl(null);
            }}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Edit
            </MenuItem>
            <MenuItem 
              onClick={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default TaskChatSection;
