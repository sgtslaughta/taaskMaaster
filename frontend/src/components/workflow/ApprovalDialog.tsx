/**
 * ApprovalDialog Component
 * 
 * Modal dialog for task approval and rejection with comment support.
 * Handles both approval and rejection workflows with appropriate validation.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { Task, TaskStatus } from '../../types/task';
import { User } from '../../types/user';

interface ApprovalDialogProps {
  open: boolean;
  task: Task | null;
  currentUser: User;
  mode: 'approve' | 'reject';
  onClose: () => void;
  onSubmit: (action: 'approve' | 'reject', comment?: string, reason?: string, notifyAssignee?: boolean) => Promise<void>;
  loading?: boolean;
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  task,
  currentUser,
  mode,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [notifyAssignee, setNotifyAssignee] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (mode === 'reject' && !reason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setError(null);
      await onSubmit(mode, comment.trim() || undefined, reason.trim() || undefined, notifyAssignee);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleClose = () => {
    setComment('');
    setReason('');
    setNotifyAssignee(true);
    setError(null);
    onClose();
  };

  if (!task) return null;

  const isApproval = mode === 'approve';
  const assignedUser = task.assigned_user;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 400
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isApproval ? (
            <ApproveIcon color="success" fontSize="large" />
          ) : (
            <RejectIcon color="error" fontSize="large" />
          )}
          <Box>
            <Typography variant="h6">
              {isApproval ? 'Approve Task' : 'Reject Task'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {task.title}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Task Information */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Task Details
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Chip
              icon={<ScheduleIcon />}
              label={`Status: ${task.status.replace('_', ' ')}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <Typography variant="body2" color="textSecondary">
              Submitted: {format(new Date(task.submitted_for_approval_at || task.updated_at), 'PPp')}
            </Typography>
          </Box>

          {assignedUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar sx={{ width: 24, height: 24 }}>
                {assignedUser.firstName?.[0] || assignedUser.username[0]}
              </Avatar>
              <Typography variant="body2">
                Assigned to: {assignedUser.firstName && assignedUser.lastName 
                  ? `${assignedUser.firstName} ${assignedUser.lastName}` 
                  : assignedUser.username}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Approval/Rejection Form */}
        <Box sx={{ mb: 2 }}>
          {isApproval ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                You are about to approve this task. The task will be marked as completed and the assignee will be notified.
              </Typography>
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  You are about to reject this task. Please provide a clear reason for rejection so the assignee can address the issues.
                </Typography>
              </Alert>

              <TextField
                fullWidth
                required
                label="Rejection Reason"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why this task is being rejected..."
                error={!reason.trim() && error !== null}
                helperText={!reason.trim() && error ? 'Rejection reason is required' : ''}
                sx={{ mb: 2 }}
              />
            </>
          )}

          <TextField
            fullWidth
            label={`Additional Comment (Optional)`}
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isApproval 
              ? "Add any feedback or congratulations..." 
              : "Add additional context or suggestions for improvement..."
            }
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifyAssignee}
                onChange={(e) => setNotifyAssignee(e.target.checked)}
                color="primary"
              />
            }
            label="Notify assignee via email and WebSocket"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action Preview */}
        <Box sx={{ p: 2, bgcolor: isApproval ? 'success.50' : 'error.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Action Summary
          </Typography>
          <Typography variant="body2">
            • Task status will change from "{task.status.replace('_', ' ')}" to "
            {isApproval ? 'Done' : 'In Progress'}"
            <br />
            • {assignedUser?.username || 'Assignee'} will receive a {isApproval ? 'approval' : 'rejection'} notification
            {notifyAssignee && (
              <>
                <br />
                • Email notification will be sent
              </>
            )}
            <br />
            • Action will be logged in task history
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={loading || (mode === 'reject' && !reason.trim())}
          variant="contained"
          color={isApproval ? 'success' : 'error'}
          startIcon={loading ? <CircularProgress size={16} /> : (isApproval ? <ApproveIcon /> : <RejectIcon />)}
        >
          {loading ? 'Processing...' : (isApproval ? 'Approve Task' : 'Reject Task')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApprovalDialog;
