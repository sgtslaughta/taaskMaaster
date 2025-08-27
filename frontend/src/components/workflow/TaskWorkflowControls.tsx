/**
 * TaskWorkflowControls Component
 * 
 * Provides workflow controls for task status transitions, approvals, and rejections.
 * Features permission-based UI visibility and real-time status updates.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  Chip, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Send as SubmitIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { Task, TaskStatus } from '../../types/task';
import { User } from '../../types/user';
import { workflowService } from '../../services/workflowService';
import { useWebSocket } from '../../hooks/useWebSocket';

interface TaskWorkflowControlsProps {
  task: Task;
  currentUser: User;
  onTaskUpdate: (updatedTask: Task) => void;
  onError: (error: string) => void;
  showHistory?: boolean;
  compact?: boolean;
}

interface TransitionDialog {
  open: boolean;
  type: 'transition' | 'approve' | 'reject';
  targetStatus?: TaskStatus;
  comment: string;
  reason: string;
}

const STATUS_CONFIG = {
  [TaskStatus.TODO]: {
    label: 'To Do',
    color: 'default' as const,
    icon: '📝'
  },
  [TaskStatus.ASSIGNED]: {
    label: 'Assigned',
    color: 'info' as const,
    icon: '👤'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'warning' as const,
    icon: '⚡'
  },
  [TaskStatus.SUBMITTED_FOR_APPROVAL]: {
    label: 'Submitted for Approval',
    color: 'secondary' as const,
    icon: '📤'
  },
  [TaskStatus.REVIEW]: {
    label: 'Review',
    color: 'secondary' as const,
    icon: '👀'
  },
  [TaskStatus.DONE]: {
    label: 'Done',
    color: 'success' as const,
    icon: '✅'
  },
  [TaskStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'error' as const,
    icon: '❌'
  }
};

const TaskWorkflowControls: React.FC<TaskWorkflowControlsProps> = ({
  task,
  currentUser,
  onTaskUpdate,
  onError,
  showHistory = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<TransitionDialog>({
    open: false,
    type: 'transition',
    comment: '',
    reason: ''
  });
  const [validTransitions, setValidTransitions] = useState<TaskStatus[]>([]);

  // WebSocket for real-time updates
  const { subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to task workflow updates
    const handleWorkflowUpdate = (data: any) => {
      if (data.task_id === task.id) {
        onTaskUpdate({
          ...task,
          status: data.new_status,
          updated_at: data.timestamp
        });
      }
    };

    subscribe('workflow_status_changed', handleWorkflowUpdate);
    return () => unsubscribe('workflow_status_changed', handleWorkflowUpdate);
  }, [task.id, subscribe, unsubscribe, onTaskUpdate, task]);

  useEffect(() => {
    // Fetch valid transitions for current task status
    const fetchValidTransitions = async () => {
      try {
        const transitions = await workflowService.getValidTransitions(task.id);
        setValidTransitions(transitions.valid_transitions || []);
      } catch (error) {
        console.error('Failed to fetch valid transitions:', error);
      }
    };

    fetchValidTransitions();
  }, [task.id, task.status]);

  // Permission checks
  const permissions = useMemo(() => {
    const isTaskCreator = task.created_by_id === currentUser.id;
    const isAssignee = task.assigned_to_id === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    return {
      canTransition: isAssignee || isAdmin,
      canApprove: isTaskCreator || isAdmin,
      canReject: isTaskCreator || isAdmin,
      canViewHistory: isTaskCreator || isAssignee || isAdmin
    };
  }, [task, currentUser]);

  // Available actions based on current status and permissions
  const availableActions = useMemo(() => {
    const actions = [];

    if (permissions.canTransition) {
      // Status transition actions
      if (task.status === TaskStatus.ASSIGNED && validTransitions.includes(TaskStatus.IN_PROGRESS)) {
        actions.push({
          type: 'transition',
          targetStatus: TaskStatus.IN_PROGRESS,
          label: 'Start Work',
          icon: <StartIcon />,
          color: 'primary' as const,
          variant: 'contained' as const
        });
      }

      if (task.status === TaskStatus.IN_PROGRESS && validTransitions.includes(TaskStatus.SUBMITTED_FOR_APPROVAL)) {
        actions.push({
          type: 'transition',
          targetStatus: TaskStatus.SUBMITTED_FOR_APPROVAL,
          label: 'Submit for Approval',
          icon: <SubmitIcon />,
          color: 'secondary' as const,
          variant: 'contained' as const
        });
      }
    }

    // Approval actions (only for task creators/admins)
    if (permissions.canApprove && task.status === TaskStatus.SUBMITTED_FOR_APPROVAL) {
      actions.push({
        type: 'approve',
        label: 'Approve',
        icon: <ApproveIcon />,
        color: 'success' as const,
        variant: 'contained' as const
      });
    }

    if (permissions.canReject && task.status === TaskStatus.SUBMITTED_FOR_APPROVAL) {
      actions.push({
        type: 'reject',
        label: 'Reject',
        icon: <RejectIcon />,
        color: 'error' as const,
        variant: 'outlined' as const
      });
    }

    return actions;
  }, [task.status, validTransitions, permissions]);

  const handleActionClick = (action: any) => {
    setDialog({
      open: true,
      type: action.type,
      targetStatus: action.targetStatus,
      comment: '',
      reason: ''
    });
  };

  const handleDialogClose = () => {
    setDialog({
      open: false,
      type: 'transition',
      comment: '',
      reason: ''
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let result;

      switch (dialog.type) {
        case 'transition':
          result = await workflowService.transitionTaskStatus({
            task_id: task.id,
            new_status: dialog.targetStatus!,
            comment: dialog.comment || undefined
          });
          break;
          
        case 'approve':
          result = await workflowService.approveTask({
            task_id: task.id,
            comment: dialog.comment || undefined
          });
          break;
          
        case 'reject':
          result = await workflowService.rejectTask({
            task_id: task.id,
            reason: dialog.reason,
            comment: dialog.comment || undefined
          });
          break;
      }

      if (result.success) {
        onTaskUpdate({
          ...task,
          status: result.new_status || task.status,
          updated_at: new Date().toISOString()
        });
        handleDialogClose();
      } else {
        onError(result.message || 'Failed to update task status');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusConfig = STATUS_CONFIG[task.status];

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={`${currentStatusConfig.icon} ${currentStatusConfig.label}`}
          color={currentStatusConfig.color}
          size="small"
        />
        {availableActions.length > 0 && (
          <ButtonGroup size="small" variant="outlined">
            {availableActions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                startIcon={action.icon}
                onClick={() => handleActionClick(action)}
                disabled={loading}
                size="small"
              >
                {action.label}
              </Button>
            ))}
          </ButtonGroup>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      {/* Current Status Display */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" component="h3">
          Workflow Status
        </Typography>
        <Chip
          label={`${currentStatusConfig.icon} ${currentStatusConfig.label}`}
          color={currentStatusConfig.color}
          variant="outlined"
        />
        {showHistory && permissions.canViewHistory && (
          <Tooltip title="View workflow history">
            <IconButton size="small">
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Available Actions */}
      {availableActions.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {availableActions.map((action, index) => (
            <Button
              key={index}
              startIcon={action.icon}
              variant={action.variant}
              color={action.color}
              onClick={() => handleActionClick(action)}
              disabled={loading}
            >
              {loading ? <CircularProgress size={16} /> : action.label}
            </Button>
          ))}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" />
            No workflow actions available for current status.
          </Box>
        </Alert>
      )}

      {/* Action Dialog */}
      <Dialog
        open={dialog.open}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialog.type === 'transition' && `Change Status to ${STATUS_CONFIG[dialog.targetStatus!]?.label}`}
          {dialog.type === 'approve' && 'Approve Task'}
          {dialog.type === 'reject' && 'Reject Task'}
        </DialogTitle>
        
        <DialogContent>
          {dialog.type === 'reject' && (
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason *"
              fullWidth
              multiline
              rows={3}
              value={dialog.reason}
              onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
          )}
          
          <TextField
            margin="dense"
            label="Comment (Optional)"
            fullWidth
            multiline
            rows={3}
            value={dialog.comment}
            onChange={(e) => setDialog({ ...dialog, comment: e.target.value })}
            placeholder="Add a comment about this workflow action..."
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading || (dialog.type === 'reject' && !dialog.reason.trim())}
          >
            {loading ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskWorkflowControls;
