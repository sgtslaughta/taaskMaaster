/**
 * ReadReceiptIndicator Component
 * 
 * Displays message delivery and read status with user avatars and timestamps.
 * Shows sent, delivered, read, and failed states for messages.
 */

import React from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Tooltip,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import {
  Done as SentIcon,
  DoneAll as DeliveredIcon,
  Visibility as ReadIcon,
  Error as FailedIcon,
  Schedule as SendingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { MessageDeliveryStatus } from '../../types/messaging';
import { User } from '../../types/user';

interface ReadReceiptIndicatorProps {
  /** Message delivery status */
  deliveryStatus: MessageDeliveryStatus;
  /** Current user ID to determine if this is own message */
  currentUserId: number;
  /** Show detailed status (default: false for compact view) */
  detailed?: boolean;
  /** Size variant */
  size?: 'small' | 'medium';
}

/**
 * ReadReceiptIndicator displays message delivery and read status
 */
export const ReadReceiptIndicator: React.FC<ReadReceiptIndicatorProps> = ({
  deliveryStatus,
  currentUserId,
  detailed = false,
  size = 'small'
}) => {
  const theme = useTheme();

  const getStatusIcon = () => {
    const iconSize = size === 'small' ? 16 : 20;
    
    switch (deliveryStatus.status) {
      case 'sending':
        return <SendingIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
      case 'sent':
        return <SentIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
      case 'delivered':
        return <DeliveredIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
      case 'read':
        return <ReadIcon sx={{ fontSize: iconSize, color: 'primary.main' }} />;
      case 'failed':
        return <FailedIcon sx={{ fontSize: iconSize, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (deliveryStatus.status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return `Delivered to ${deliveryStatus.delivered_to?.length || 0}`;
      case 'read':
        return `Read by ${deliveryStatus.read_by?.length || 0}`;
      case 'failed':
        return 'Failed to send';
      default:
        return '';
    }
  };

  const getTooltipContent = () => {
    const { status, delivered_to, read_by, failed_recipients } = deliveryStatus;
    
    if (status === 'failed' && failed_recipients?.length) {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Failed to send to:
          </Typography>
          {failed_recipients.map(({ user, error }) => (
            <Typography key={user.id} variant="body2">
              {user.username}: {error}
            </Typography>
          ))}
        </Box>
      );
    }

    if (status === 'read' && read_by?.length) {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Read by:
          </Typography>
          {read_by.map(({ user, read_at }) => (
            <Typography key={user.id} variant="body2">
              {user.username} • {format(new Date(read_at), 'MMM d, h:mm a')}
            </Typography>
          ))}
        </Box>
      );
    }

    if (status === 'delivered' && delivered_to?.length) {
      return (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Delivered to:
          </Typography>
          {delivered_to.map((user) => (
            <Typography key={user.id} variant="body2">
              {user.username}
            </Typography>
          ))}
        </Box>
      );
    }

    return getStatusText();
  };

  // Don't show read receipts for messages from other users to current user
  if (deliveryStatus.status === 'read' && currentUserId !== deliveryStatus.message_id) {
    return null;
  }

  if (detailed) {
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {getStatusIcon()}
          <Typography variant="caption" color="text.secondary">
            {getStatusText()}
          </Typography>
        </Box>
        
        {deliveryStatus.status === 'read' && deliveryStatus.read_by?.length && (
          <AvatarGroup 
            max={3} 
            sx={{ 
              '& .MuiAvatar-root': { 
                width: 20, 
                height: 20, 
                fontSize: '0.75rem' 
              } 
            }}
          >
            {deliveryStatus.read_by.map(({ user }) => (
              <Tooltip key={user.id} title={user.username}>
                <Avatar
                  src={user.avatar_url}
                  alt={user.username}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  {user.username[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        {deliveryStatus.status === 'failed' && deliveryStatus.failed_recipients?.length && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={`Failed: ${deliveryStatus.failed_recipients.length} recipient(s)`}
              color="error"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    );
  }

  // Compact view
  return (
    <Tooltip title={getTooltipContent()} placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          ml: 1,
          cursor: 'help'
        }}
      >
        {getStatusIcon()}
        {deliveryStatus.status === 'read' && deliveryStatus.read_by?.length && (
          <AvatarGroup 
            max={2} 
            sx={{ 
              '& .MuiAvatar-root': { 
                width: 16, 
                height: 16, 
                fontSize: '0.6rem',
                border: 'none'
              } 
            }}
          >
            {deliveryStatus.read_by.slice(0, 2).map(({ user }) => (
              <Avatar
                key={user.id}
                src={user.avatar_url}
                alt={user.username}
                sx={{ bgcolor: 'primary.main' }}
              >
                {user.username[0]?.toUpperCase()}
              </Avatar>
            ))}
          </AvatarGroup>
        )}
      </Box>
    </Tooltip>
  );
};

export default ReadReceiptIndicator;
