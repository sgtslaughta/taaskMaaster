/**
 * StatusHistoryTimeline Component
 * 
 * Displays a visual timeline of task status changes and workflow events.
 * Shows user actions, timestamps, and comments for each status transition.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Paper,
  Avatar,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Computer as SystemIcon,
  Check as ApprovedIcon,
  Close as RejectedIcon,
  Send as SubmittedIcon,
  PlayArrow as StartedIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';

import { TaskStatusHistory } from '../../types/workflow';
import { TaskStatus } from '../../types/task';
import { workflowService } from '../../services/workflowService';

interface StatusHistoryTimelineProps {
  taskId: number;
  compact?: boolean;
  maxItems?: number;
  showUserAvatars?: boolean;
  autoRefresh?: boolean;
}

interface TimelineEvent {
  id: number;
  action: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  } | null;
  comment?: string;
  reason?: string;
  createdAt: string;
  isSystemGenerated: boolean;
}

const STATUS_ICONS = {
  [TaskStatus.TODO]: '📝',
  [TaskStatus.ASSIGNED]: '👤',
  [TaskStatus.IN_PROGRESS]: '⚡',
  [TaskStatus.SUBMITTED_FOR_APPROVAL]: '📤',
  [TaskStatus.REVIEW]: '👀',
  [TaskStatus.DONE]: '✅',
  [TaskStatus.CANCELLED]: '❌'
};

const ACTION_ICONS = {
  'created': <PersonIcon />,
  'assigned': <PersonIcon />,
  'started': <StartedIcon />,
  'submitted': <SubmittedIcon />,
  'approved': <ApprovedIcon />,
  'rejected': <RejectedIcon />,
  'completed': <ApprovedIcon />,
  'cancelled': <RejectedIcon />,
  'system': <SystemIcon />
};

const ACTION_COLORS = {
  'created': 'primary',
  'assigned': 'info',
  'started': 'warning',
  'submitted': 'secondary',
  'approved': 'success',
  'rejected': 'error',
  'completed': 'success',
  'cancelled': 'error',
  'system': 'default'
} as const;

const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps> = ({
  taskId,
  compact = false,
  maxItems = 10,
  showUserAvatars = true,
  autoRefresh = false
}) => {
  const [history, setHistory] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchStatusHistory();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatusHistory, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [taskId, autoRefresh]);

  const fetchStatusHistory = async () => {
    try {
      setLoading(true);
      const response = await workflowService.getTaskStatusHistory(taskId);
      
      // Transform API response to timeline events
      const events: TimelineEvent[] = response.history.map((item: TaskStatusHistory) => ({
        id: item.id,
        action: determineAction(item.previous_status, item.new_status),
        previousStatus: item.previous_status,
        newStatus: item.new_status,
        user: item.user ? {
          id: item.user.id,
          username: item.user.username,
          firstName: item.user.first_name,
          lastName: item.user.last_name,
          avatar: item.user.avatar
        } : null,
        comment: item.comment,
        reason: item.reason,
        createdAt: item.created_at,
        isSystemGenerated: item.is_system_generated || false
      }));

      setHistory(events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status history');
    } finally {
      setLoading(false);
    }
  };

  const determineAction = (previousStatus: TaskStatus | null, newStatus: TaskStatus): string => {
    if (!previousStatus) return 'created';
    
    switch (newStatus) {
      case TaskStatus.ASSIGNED:
        return 'assigned';
      case TaskStatus.IN_PROGRESS:
        return 'started';
      case TaskStatus.SUBMITTED_FOR_APPROVAL:
        return 'submitted';
      case TaskStatus.DONE:
        return previousStatus === TaskStatus.SUBMITTED_FOR_APPROVAL ? 'approved' : 'completed';
      case TaskStatus.CANCELLED:
        return 'cancelled';
      case TaskStatus.IN_PROGRESS:
        return previousStatus === TaskStatus.SUBMITTED_FOR_APPROVAL ? 'rejected' : 'started';
      default:
        return 'system';
    }
  };

  const toggleExpanded = (eventId: number) => {
    setExpanded(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const getDisplayName = (user: TimelineEvent['user']): string => {
    if (!user) return 'System';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const displayedHistory = showAll ? history : history.slice(0, maxItems);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Status History
        </Typography>
        <Timeline>
          {[1, 2, 3].map((item) => (
            <TimelineItem key={item}>
              <TimelineSeparator>
                <Skeleton variant="circular" width={40} height={40} />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Skeleton variant="rectangular" height={60} />
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">
          Failed to load status history: {error}
        </Typography>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No status history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: compact ? 1 : 2 }}>
      {!compact && (
        <Typography variant="h6" gutterBottom>
          Status History
        </Typography>
      )}

      <Timeline position={compact ? 'right' : 'alternate'}>
        {displayedHistory.map((event, index) => {
          const isExpanded = expanded.includes(event.id);
          const hasDetails = event.comment || event.reason;
          const actionColor = ACTION_COLORS[event.action as keyof typeof ACTION_COLORS] || 'default';

          return (
            <TimelineItem key={event.id}>
              <TimelineSeparator>
                <TimelineDot color={actionColor} variant="outlined">
                  {showUserAvatars && event.user ? (
                    <Avatar 
                      sx={{ width: 24, height: 24 }}
                      src={event.user.avatar}
                    >
                      {event.user.firstName?.[0] || event.user.username[0]}
                    </Avatar>
                  ) : (
                    ACTION_ICONS[event.action as keyof typeof ACTION_ICONS] || ACTION_ICONS.system
                  )}
                </TimelineDot>
                {index < displayedHistory.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Paper
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    bgcolor: event.isSystemGenerated ? 'grey.50' : 'background.paper',
                    border: event.isSystemGenerated ? '1px dashed' : '1px solid',
                    borderColor: event.isSystemGenerated ? 'grey.300' : 'divider'
                  }}
                >
                  {/* Event Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" component="div">
                      {getDisplayName(event.user)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {event.action}
                    </Typography>
                    {event.newStatus && (
                      <Chip
                        size="small"
                        label={`${STATUS_ICONS[event.newStatus]} ${event.newStatus.replace('_', ' ')}`}
                        color={actionColor}
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Timestamp */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: hasDetails ? 1 : 0 }}>
                    <Tooltip title={format(new Date(event.createdAt), 'PPpp')}>
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                      </Typography>
                    </Tooltip>
                    {hasDetails && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(event.id)}
                        sx={{ ml: 'auto' }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>

                  {/* Expandable Details */}
                  {hasDetails && (
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        {event.reason && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Reason:
                            </Typography>
                            <Typography variant="body2">
                              {event.reason}
                            </Typography>
                          </Box>
                        )}
                        {event.comment && (
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Comment:
                            </Typography>
                            <Typography variant="body2">
                              {event.comment}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>

      {/* Show More/Less Button */}
      {history.length > maxItems && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <IconButton onClick={() => setShowAll(!showAll)}>
            {showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="caption" display="block">
            {showAll ? 'Show Less' : `Show ${history.length - maxItems} More`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatusHistoryTimeline;
