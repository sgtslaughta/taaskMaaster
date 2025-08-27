/**
 * WorkflowProgressIndicator Component
 * 
 * Visual progress indicator showing the current task status within the workflow.
 * Displays progress steps with completion status and estimated progress percentage.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  StepIcon,
  LinearProgress,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Assignment as AssignedIcon,
  PlayArrow as InProgressIcon,
  Send as SubmittedIcon,
  Visibility as ReviewIcon,
  Check as DoneIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';

import { TaskStatus } from '../../types/task';

interface WorkflowProgressIndicatorProps {
  currentStatus: TaskStatus;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface WorkflowStep {
  status: TaskStatus;
  label: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isSkipped: boolean;
}

const WORKFLOW_STEPS = [
  {
    status: TaskStatus.ASSIGNED,
    label: 'Assigned',
    description: 'Task has been assigned to a team member',
    icon: <AssignedIcon />,
    color: '#2196f3'
  },
  {
    status: TaskStatus.IN_PROGRESS,
    label: 'In Progress',
    description: 'Work is actively being done on this task',
    icon: <InProgressIcon />,
    color: '#ff9800'
  },
  {
    status: TaskStatus.SUBMITTED_FOR_APPROVAL,
    label: 'Submitted',
    description: 'Task has been submitted for approval',
    icon: <SubmittedIcon />,
    color: '#9c27b0'
  },
  {
    status: TaskStatus.REVIEW,
    label: 'Review',
    description: 'Task is under review by stakeholders',
    icon: <ReviewIcon />,
    color: '#673ab7'
  },
  {
    status: TaskStatus.DONE,
    label: 'Done',
    description: 'Task has been completed successfully',
    icon: <DoneIcon />,
    color: '#4caf50'
  }
];

const WorkflowProgressIndicator: React.FC<WorkflowProgressIndicatorProps> = ({
  currentStatus,
  variant = 'horizontal',
  showLabels = true,
  showPercentage = true,
  animated = true,
  size = 'medium'
}) => {
  const theme = useTheme();

  const workflowSteps: WorkflowStep[] = useMemo(() => {
    const statusOrder = [
      TaskStatus.ASSIGNED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.SUBMITTED_FOR_APPROVAL,
      TaskStatus.REVIEW,
      TaskStatus.DONE
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);
    const isCancelled = currentStatus === TaskStatus.CANCELLED;

    return WORKFLOW_STEPS.map((step, index) => {
      let isCompleted = false;
      let isCurrent = false;
      let isSkipped = false;

      if (isCancelled) {
        // If task is cancelled, mark all as skipped except completed ones
        isCompleted = index < currentIndex;
        isSkipped = index >= currentIndex;
      } else {
        isCompleted = index < currentIndex;
        isCurrent = index === currentIndex;
      }

      return {
        ...step,
        isCompleted,
        isCurrent,
        isSkipped
      };
    });
  }, [currentStatus]);

  const progressPercentage = useMemo(() => {
    if (currentStatus === TaskStatus.CANCELLED) {
      return 0;
    }
    
    const currentIndex = workflowSteps.findIndex(step => step.isCurrent);
    if (currentIndex === -1) {
      return currentStatus === TaskStatus.DONE ? 100 : 0;
    }
    
    return Math.round(((currentIndex + 1) / workflowSteps.length) * 100);
  }, [workflowSteps, currentStatus]);

  const getStepIconColor = (step: WorkflowStep) => {
    if (step.isCompleted) return theme.palette.success.main;
    if (step.isCurrent) return step.color;
    if (step.isSkipped) return theme.palette.error.main;
    return theme.palette.grey[400];
  };

  const getStepBackgroundColor = (step: WorkflowStep) => {
    if (step.isCompleted) return alpha(theme.palette.success.main, 0.1);
    if (step.isCurrent) return alpha(step.color, 0.1);
    if (step.isSkipped) return alpha(theme.palette.error.main, 0.1);
    return 'transparent';
  };

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            flexGrow: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundColor: currentStatus === TaskStatus.CANCELLED 
                ? theme.palette.error.main 
                : theme.palette.primary.main,
              transition: animated ? 'transform 0.3s ease-in-out' : 'none'
            }
          }}
        />
        {showPercentage && (
          <Typography variant="caption" color="textSecondary" sx={{ minWidth: 35 }}>
            {progressPercentage}%
          </Typography>
        )}
        {currentStatus === TaskStatus.CANCELLED && (
          <Chip
            icon={<CancelledIcon />}
            label="Cancelled"
            size="small"
            color="error"
            variant="outlined"
          />
        )}
      </Box>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Box>
        {showPercentage && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2">
              Workflow Progress
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {progressPercentage}% Complete
            </Typography>
          </Box>
        )}
        
        <Stepper 
          activeStep={workflowSteps.findIndex(step => step.isCurrent)} 
          alternativeLabel
          sx={{
            '& .MuiStepConnector-line': {
              borderTopWidth: 2,
              transition: animated ? 'border-color 0.3s ease' : 'none'
            }
          }}
        >
          {workflowSteps.map((step, index) => (
            <Step key={step.status} completed={step.isCompleted}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: size === 'small' ? 32 : size === 'large' ? 48 : 40,
                      height: size === 'small' ? 32 : size === 'large' ? 48 : 40,
                      borderRadius: '50%',
                      backgroundColor: getStepBackgroundColor(step),
                      border: `2px solid ${getStepIconColor(step)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getStepIconColor(step),
                      transition: animated ? 'all 0.3s ease' : 'none',
                      transform: step.isCurrent ? 'scale(1.1)' : 'scale(1)',
                      '& svg': {
                        fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20
                      }
                    }}
                  >
                    {React.cloneElement(step.icon, {
                      style: { color: getStepIconColor(step) }
                    })}
                  </Box>
                )}
              >
                {showLabels && (
                  <Tooltip title={step.description} placement="bottom">
                    <Typography
                      variant={size === 'small' ? 'caption' : 'body2'}
                      color={step.isCurrent ? 'primary' : 'textSecondary'}
                      sx={{
                        fontWeight: step.isCurrent ? 600 : 400,
                        mt: 1
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Tooltip>
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {currentStatus === TaskStatus.CANCELLED && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              icon={<CancelledIcon />}
              label="Task Cancelled"
              color="error"
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    );
  }

  // Vertical variant
  return (
    <Box>
      {showPercentage && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Workflow Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                transition: animated ? 'transform 0.3s ease-in-out' : 'none'
              }
            }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
            {progressPercentage}% Complete
          </Typography>
        </Box>
      )}

      <Stepper 
        activeStep={workflowSteps.findIndex(step => step.isCurrent)} 
        orientation="vertical"
        sx={{
          '& .MuiStepConnector-line': {
            borderLeftWidth: 2,
            minHeight: 20,
            transition: animated ? 'border-color 0.3s ease' : 'none'
          }
        }}
      >
        {workflowSteps.map((step, index) => (
          <Step key={step.status} completed={step.isCompleted}>
            <StepLabel
              StepIconComponent={({ active, completed }) => (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: getStepBackgroundColor(step),
                    border: `2px solid ${getStepIconColor(step)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getStepIconColor(step),
                    transition: animated ? 'all 0.3s ease' : 'none'
                  }}
                >
                  {React.cloneElement(step.icon, {
                    style: { color: getStepIconColor(step), fontSize: 16 }
                  })}
                </Box>
              )}
            >
              <Typography
                variant="body2"
                color={step.isCurrent ? 'primary' : 'textSecondary'}
                sx={{ fontWeight: step.isCurrent ? 600 : 400 }}
              >
                {step.label}
              </Typography>
            </StepLabel>
            
            {showLabels && (
              <StepContent>
                <Typography variant="caption" color="textSecondary">
                  {step.description}
                </Typography>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>

      {currentStatus === TaskStatus.CANCELLED && (
        <Box sx={{ mt: 2 }}>
          <Chip
            icon={<CancelledIcon />}
            label="Task Cancelled"
            color="error"
            variant="outlined"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default WorkflowProgressIndicator;
