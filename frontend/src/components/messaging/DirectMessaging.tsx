/**
 * DirectMessaging Component
 * 
 * Real-time direct messaging interface between users with conversation history,
 * media support, and typing indicators.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Badge,
  Divider,
  Chip,
  InputAdornment,
  Drawer,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
  Circle as OnlineIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

import { DirectMessage, Conversation } from '../../types/messaging';
import { User } from '../../types/user';
import { MediaAttachment } from '../../types/media';
import { messagingService } from '../../services/messagingService';
import { mediaService } from '../../services/mediaService';
import { userService } from '../../services/userService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MediaUploader } from '../common/MediaUploader';
import { ReadReceiptIndicator } from './ReadReceiptIndicator';

interface DirectMessagingProps {
  currentUser: User;
  initialConversationId?: number;
  onConversationChange?: (conversation: Conversation | null) => void;
  drawerWidth?: number;
  isMobile?: boolean;
}

interface ConversationWithMessages extends Conversation {
  messages: DirectMessage[];
  typingUsers: User[];
  isLoading: boolean;
}

const DirectMessaging: React.FC<DirectMessagingProps> = ({
  currentUser,
  initialConversationId,
  onConversationChange,
  drawerWidth = 300,
  isMobile = false
}) => {
  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { subscribe, unsubscribe, send, isConnected } = useWebSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithMessages | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<Record<number, any>>({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(!isMobileScreen);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);

  // Set initial conversation
  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        handleConversationSelect(conversation);
      }
    }
  }, [initialConversationId, conversations]);

  // WebSocket event subscriptions
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (activeConversation && data.conversation_id === activeConversation.id) {
        setActiveConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message]
        } : null);
        scrollToBottom();
      }
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === data.conversation_id 
          ? { 
              ...conv, 
              last_message: data.message,
              updated_at: data.message.created_at,
              unread_count: conv.id === activeConversation?.id ? 0 : (conv.unread_count || 0) + 1
            }
          : conv
      ));
    };

    const handleTypingUpdate = (data: any) => {
      if (activeConversation && data.conversation_id === activeConversation.id) {
        setActiveConversation(prev => prev ? {
          ...prev,
          typingUsers: data.typing_users.filter((user: User) => user.id !== currentUser.id)
        } : null);
      }
    };

    const handleUserStatusUpdate = (data: any) => {
      setUsers(prev => prev.map(user => 
        user.id === data.user_id 
          ? { ...user, is_online: data.is_online, last_seen: data.last_seen }
          : user
      ));
    };

    const handleMessageRead = (data: any) => {
      if (activeConversation && data.conversation_id === activeConversation.id) {
        setActiveConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === data.message_id ? { ...msg, read_at: data.read_at } : msg
          )
        } : null);
      }
    };

    subscribe('direct_message_received', handleNewMessage);
    subscribe('user_typing_direct', handleTypingUpdate);
    subscribe('user_status_changed', handleUserStatusUpdate);
    subscribe('message_read', handleMessageRead);

    return () => {
      unsubscribe('direct_message_received', handleNewMessage);
      unsubscribe('user_typing_direct', handleTypingUpdate);
      unsubscribe('user_status_changed', handleUserStatusUpdate);
      unsubscribe('message_read', handleMessageRead);
    };
  }, [activeConversation, currentUser.id, subscribe, unsubscribe, scrollToBottom]);

  const loadConversations = async () => {
    try {
      const response = await messagingService.getConversations();
      setConversations(response.conversations);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.users.filter(user => user.id !== currentUser.id));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      const response = await messagingService.getConversationMessages(conversationId);
      return response.messages;
    } catch (err) {
      throw new Error('Failed to load messages');
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    try {
      setActiveConversation({
        ...conversation,
        messages: [],
        typingUsers: [],
        isLoading: true
      });

      const messages = await loadConversationMessages(conversation.id);
      
      setActiveConversation(prev => prev ? {
        ...prev,
        messages,
        isLoading: false
      } : null);

      // Mark messages as read
      await messagingService.markConversationAsRead(conversation.id);
      
      // Update unread count in conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
      ));

      onConversationChange?.(conversation);
      scrollToBottom();

      if (isMobileScreen) {
        setDrawerOpen(false);
      }
    } catch (err) {
      setError('Failed to load conversation');
    }
  };

  const handleStartNewConversation = async (user: User) => {
    try {
      const response = await messagingService.createConversation({
        participant_ids: [user.id],
        type: 'direct'
      });
      
      const newConversation = response.conversation;
      setConversations(prev => [newConversation, ...prev]);
      handleConversationSelect(newConversation);
    } catch (err) {
      setError('Failed to start conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!activeConversation || (!newMessage.trim() && selectedMedia.length === 0)) return;

    try {
      let mediaAttachments: MediaAttachment[] = [];
      
      // Upload media files if any
      if (selectedMedia.length > 0) {
        const uploadPromises = selectedMedia.map(file => 
          mediaService.uploadMedia(file, 'message')
        );
        const uploadResults = await Promise.all(uploadPromises);
        mediaAttachments = uploadResults.map(result => result.media);
      }

      const messageData = {
        conversation_id: activeConversation.id,
        content: newMessage.trim(),
        media_attachments: mediaAttachments.map(media => media.id)
      };

      await messagingService.sendDirectMessage(messageData);
      
      // Clear form
      setNewMessage('');
      setSelectedMedia([]);
      
      // Send typing stopped event
      send({
        type: 'typing_stopped_direct',
        conversation_id: activeConversation.id,
        user_id: currentUser.id
      });

    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (activeConversation && value.trim()) {
      send({
        type: 'typing_started_direct',
        conversation_id: activeConversation.id,
        user_id: currentUser.id
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to send typing stopped
      typingTimeoutRef.current = setTimeout(() => {
        send({
          type: 'typing_stopped_direct',
          conversation_id: activeConversation.id,
          user_id: currentUser.id
        });
      }, 3000);
    }
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv => 
    conv.participants.some(p => 
      p.id !== currentUser.id && (
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  const renderMessage = (message: DirectMessage) => {
    const isOwnMessage = message.sender_id === currentUser.id;
    const sender = message.sender;

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 1
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
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
          }}
        >
          <Typography 
            variant="body2"
            sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {message.content}
          </Typography>

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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Typography 
              variant="caption" 
              sx={{ opacity: isOwnMessage ? 0.8 : 0.6 }}
            >
              {formatMessageTime(message.created_at)}
            </Typography>
            
            {isOwnMessage && (
              <ReadReceiptIndicator
                deliveryStatus={{
                  message_id: message.id,
                  status: message.read_at ? 'read' : 'delivered',
                  read_by: message.read_at ? [{
                    user: otherParticipant!,
                    read_at: message.read_at
                  }] : undefined
                }}
                currentUserId={currentUser.id}
              />
            )}
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

  const renderConversationsList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Messages</Typography>
        {!isConnected && (
          <Typography variant="caption" color="error">
            Disconnected - trying to reconnect...
          </Typography>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations or users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Conversations */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 1 }}>
            {[1, 2, 3].map((item) => (
              <ListItem key={item}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))}
          </Box>
        ) : (
          <List>
            {/* Existing Conversations */}
            {filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
              if (!otherParticipant) return null;

              return (
                <ListItemButton
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  selected={activeConversation?.id === conversation.id}
                >
                  <ListItemAvatar>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!otherParticipant.is_online}
                    >
                      <Avatar src={otherParticipant.avatar}>
                        {otherParticipant.firstName?.[0] || otherParticipant.username[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() || otherParticipant.username}
                    secondary={conversation.last_message?.content || 'No messages yet'}
                    secondaryTypographyProps={{
                      noWrap: true,
                      style: { maxWidth: 180 }
                    }}
                  />
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Chip
                      size="small"
                      label={conversation.unread_count}
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemButton>
              );
            })}

            {/* Available Users for New Conversations */}
            {searchQuery && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ px: 2, color: 'textSecondary' }}>
                  Start new conversation
                </Typography>
                {filteredUsers.map((user) => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleStartNewConversation(user)}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!user.is_online}
                      >
                        <Avatar src={user.avatar}>
                          {user.firstName?.[0] || user.username[0]}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`.trim() || user.username}
                      secondary={user.is_online ? 'Online' : `Last seen ${formatDistanceToNow(new Date(user.last_seen || ''), { addSuffix: true })}`}
                    />
                  </ListItemButton>
                ))}
              </>
            )}
          </List>
        )}
      </Box>
    </Box>
  );

  const renderChatArea = () => {
    if (!activeConversation) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h6" color="textSecondary">
            Select a conversation to start messaging
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Choose from your existing conversations or search for users to start a new chat
          </Typography>
        </Box>
      );
    }

    const otherParticipant = activeConversation.participants.find(p => p.id !== currentUser.id);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          {isMobileScreen && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <CloseIcon />
            </IconButton>
          )}
          
          <Badge
            color="success"
            variant="dot"
            invisible={!otherParticipant?.is_online}
          >
            <Avatar src={otherParticipant?.avatar}>
              {otherParticipant?.firstName?.[0] || otherParticipant?.username[0]}
            </Avatar>
          </Badge>
          
          <Box>
            <Typography variant="h6">
              {`${otherParticipant?.firstName} ${otherParticipant?.lastName}`.trim() || otherParticipant?.username}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {otherParticipant?.is_online ? 'Online' : `Last seen ${formatDistanceToNow(new Date(otherParticipant?.last_seen || ''), { addSuffix: true })}`}
            </Typography>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
            {error}
          </Alert>
        )}

        {/* Messages */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeConversation.isLoading ? (
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
          ) : (
            <>
              {activeConversation.messages.map(renderMessage)}
              
              {/* Typing Indicators */}
              {activeConversation.typingUsers.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1, opacity: 0.7 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                    {activeConversation.typingUsers[0].firstName?.[0] || activeConversation.typingUsers[0].username[0]}
                  </Avatar>
                  <Typography variant="caption">
                    {activeConversation.typingUsers[0].firstName || activeConversation.typingUsers[0].username} is typing...
                  </Typography>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <MediaUploader
              onFilesSelected={setSelectedMedia}
              maxFiles={5}
              acceptedTypes={['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx']}
            >
              <IconButton size="small" color="primary">
                <AttachIcon />
              </IconButton>
            </MediaUploader>

            <TextField
              ref={inputRef}
              multiline
              maxRows={4}
              fullWidth
              size="small"
              placeholder="Type a message..."
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
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Conversations Sidebar */}
      {isMobileScreen ? (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box'
            }
          }}
        >
          {renderConversationsList()}
        </Drawer>
      ) : (
        <Paper
          sx={{
            width: drawerWidth,
            borderRight: 1,
            borderColor: 'divider',
            height: '100%'
          }}
        >
          {renderConversationsList()}
        </Paper>
      )}

      {/* Chat Area */}
      <Box sx={{ flex: 1, height: '100%' }}>
        {renderChatArea()}
      </Box>
    </Box>
  );
};

export default DirectMessaging;
