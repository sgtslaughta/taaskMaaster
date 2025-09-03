/**
 * TaskStepIndicator Component
 * 
 * A step-based workflow indicator for task status progression inspired by react-native-step-indicator
 * Features heroicon-themed design with interactive step transitions and visual progress tracking.
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../../design-system/components/Button';
import { cn } from '../../design-system/utils/cn';
import {
  ClockIcon,
  UserIcon,
  PlayIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
  PlayIcon as PlayIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid,
  EyeIcon as EyeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid';

import { Task } from '../tasks/TaskList';
import { User } from '../../types/user';
import { workflowService, WorkflowUser } from '../../services/workflowService';

interface TaskStepIndicatorProps {
  task: Task;
  currentUser: User;
  onTaskUpdate: (taskId: number, updates: { status: Task['status'] }) => void;
  onError: (error: string) => void;
  onRefreshTask?: (taskId: number) => void; // Optional callback to refresh task data
  className?: string;
}

interface WorkflowStep {
  id: string;
  label: string;
  status: Task['status'];
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  activeColor: string;
}



const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'todo',
    label: 'Assigned',
    status: 'todo',
    icon: UserIcon,
    iconSolid: UserIconSolid,
    description: 'Task has been assigned and is ready to be started',
    color: 'text-blue-500 border-blue-300',
    activeColor: 'text-blue-700 border-blue-500 bg-blue-50'
  },
  {
    id: 'in_progress',
    label: 'Begin Task',
    status: 'in_progress',
    icon: PlayIcon,
    iconSolid: PlayIconSolid,
    description: 'Start working on this task',
    color: 'text-yellow-500 border-yellow-300',
    activeColor: 'text-yellow-700 border-yellow-500 bg-yellow-50'
  },
  {
    id: 'review',
    label: 'Submit for Review',
    status: 'submitted_for_approval',
    icon: PaperAirplaneIcon,
    iconSolid: PaperAirplaneIconSolid,
    description: 'Submit task for approval',
    color: 'text-purple-500 border-purple-300',
    activeColor: 'text-purple-700 border-purple-500 bg-purple-50'
  },
  {
    id: 'done',
    label: 'Done',
    status: 'done',
    icon: CheckCircleIcon,
    iconSolid: CheckCircleIconSolid,
    description: 'Task is completed and approved',
    color: 'text-green-500 border-green-300',
    activeColor: 'text-green-700 border-green-500 bg-green-50'
  }
];

/**
 * @description Get dynamic step label based on current task status
 */
const getStepLabel = (step: WorkflowStep, currentStatus: Task['status']): string => {
  switch (step.id) {
    case 'in_progress':
      return currentStatus === 'in_progress' ? 'In Progress' : 'Begin Task';
    case 'review':
      return currentStatus === 'submitted_for_approval' ? 'Pending Approval' : 'Submit for Review';
    default:
      return step.label;
  }
};

const TaskStepIndicator: React.FC<TaskStepIndicatorProps> = ({
  task,
  currentUser,
  onTaskUpdate,
  onError,
  onRefreshTask,
  className
}) => {
  const [loading, setLoading] = useState(false);

  // Find current step index
  const currentStepIndex = WORKFLOW_STEPS.findIndex(step => step.status === task.status);
  const currentStep = WORKFLOW_STEPS[currentStepIndex] || WORKFLOW_STEPS[0];

  // Calculate permissions
  const canTransition = useMemo(() => {
    const isAssigned = task.assignedTo?.id === currentUser.id;
    const isCreator = task.createdById === parseInt(currentUser.id);
    return isAssigned || isCreator || currentUser.role === 'admin' || currentUser.role === 'organizer';
  }, [task, currentUser]);

  // Get next available step
  const nextStep = useMemo(() => {
    if (currentStepIndex < WORKFLOW_STEPS.length - 1) {
      return WORKFLOW_STEPS[currentStepIndex + 1];
    }
    return null;
  }, [currentStepIndex]);

  // Get action-oriented tooltip text
  const getTooltipText = (step: WorkflowStep, state: string, isClickable: boolean) => {
    if (!isClickable) return step.description;
    
    switch (step.status) {
      case 'todo':
        return state === 'current' ? 'Task is assigned and ready to begin' : 'View assigned task';
      case 'in_progress':
        if (task.status === 'in_progress') {
          return state === 'current' ? 'Task is in progress' : 'Continue working on task';
        } else {
          return state === 'current' ? 'Ready to start' : 'Begin working on task';
        }
      case 'submitted_for_approval':
        if (task.status === 'submitted_for_approval') {
          return state === 'current' ? 'Task is pending approval' : 'Awaiting approval';
        } else {
          return state === 'current' ? 'Ready to submit' : 'Submit task for review';
        }
      case 'done':
        return state === 'current' ? 'Task is completed and approved' : 'Complete and approve task';
      default:
        return step.description;
    }
  };

  const handleStepTransition = async (targetStatus: Task['status']) => {
    if (!canTransition) {
      onError('You do not have permission to change this task status');
      return;
    }

    // Check if task is already in the target status
    if (task.status === targetStatus) {
      console.log('TaskStepIndicator: Task is already in target status:', targetStatus);
      return;
    }

    // Direct transition for all status changes - no dialog required
    await performTransition(targetStatus);
  };

  const performTransition = async (targetStatus: Task['status'], reason?: string, comment?: string) => {
    try {
      setLoading(true);
      
      console.log('TaskStepIndicator: Attempting transition:', {
        taskId: task.id,
        currentStatus: task.status,
        targetStatus,
        reason,
        comment
      });
      
      // Convert User to WorkflowUser
      const workflowUser: WorkflowUser = {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role || 'user'
      };
      
      // Use workflow service for proper notifications
      const response = await workflowService.transitionTaskStatus({
        task_id: task.id,
        new_status: targetStatus,
        comment: reason ? `${reason}${comment ? ` - ${comment}` : ''}` : comment || ''
      }, workflowUser);

      console.log('TaskStepIndicator: Transition successful:', response.message);
      
      // Always update with the actual status from the backend response
      // This ensures we sync with the real backend state
      onTaskUpdate(task.id, { status: response.new_status as Task['status'] });
      
      // If we have a refresh callback, also trigger a full refresh for good measure
      if (onRefreshTask) {
        console.log('TaskStepIndicator: Also triggering full task refresh');
        setTimeout(() => onRefreshTask(task.id), 100); // Small delay to avoid race conditions
      }
    } catch (error: any) {
      console.error('TaskStepIndicator: Transition failed:', error);
      onError(error.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleDialogSubmit = () => {
    performTransition(dialog.targetStatus, dialog.reason, dialog.comment);
  };

  const getStepState = (step: WorkflowStep, index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const renderStep = (step: WorkflowStep, index: number) => {
    const state = getStepState(step, index);
    const IconComponent = state === 'completed' ? step.iconSolid : step.icon;
    const isClickable = canTransition && (index === currentStepIndex + 1 || index === currentStepIndex);

    return (
      <div key={step.id} className={cn("flex items-center", index < WORKFLOW_STEPS.length - 1 ? "flex-1" : "")}>
        {/* Step Circle */}
        <div className="flex flex-col items-center relative z-10 flex-shrink-0">
          <button
            onClick={() => isClickable ? handleStepTransition(step.status) : undefined}
            disabled={!isClickable || loading}
            className={cn(
              "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 bg-white dark:bg-gray-800",
              state === 'completed' && step.status === 'done' && "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20",
              state === 'completed' && step.status !== 'done' && "border-gray-400 text-gray-600",
              state === 'current' && step.status === 'done' && "border-green-500 text-green-600 shadow-lg bg-green-50 dark:bg-green-900/20",
              state === 'current' && step.status !== 'done' && "border-blue-500 text-blue-600 shadow-lg",
              state === 'pending' && "border-gray-300 text-gray-400",
              isClickable && "hover:scale-105 cursor-pointer hover:shadow-md",
              !isClickable && "cursor-default",
              loading && "opacity-50"
            )}
            title={getTooltipText(step, state, isClickable)}
          >
            <IconComponent className="w-6 h-6" />
            {state === 'current' && (
              <div className={cn(
                "absolute -inset-1 rounded-full border-2 animate-pulse opacity-75",
                step.status === 'done' ? "border-green-400" : "border-blue-400"
              )} />
            )}
          </button>
          
          {/* Step Label */}
          <div className="mt-3 text-center">
            <div className={cn(
              "text-sm font-medium transition-colors whitespace-nowrap",
              state === 'completed' && step.status === 'done' && "text-green-600 font-semibold",
              state === 'completed' && step.status !== 'done' && "text-gray-500",
              state === 'current' && step.status === 'done' && "text-green-600 font-semibold",
              state === 'current' && step.status !== 'done' && "text-blue-600 font-semibold",
              state === 'pending' && "text-gray-400"
            )}>
              {getStepLabel(step, task.status)}
            </div>
          </div>
        </div>

        {/* Connector Line */}
        {index < WORKFLOW_STEPS.length - 1 && (
          <div className="flex-1 relative mx-6 flex items-center justify-center h-12" style={{ transform: 'translateY(-25%)' }}>
            <div className={cn(
              "w-full h-1 rounded-full relative overflow-hidden transition-all duration-300",
              index < currentStepIndex ? "bg-gray-400" : "bg-gray-200 dark:bg-gray-600"
            )}>
              {/* Completed lines - solid fill */}
              {index < currentStepIndex && (
                <div className="absolute top-0 left-0 h-full w-full bg-gray-400 rounded-full" />
              )}
              
              {/* Active line animation - fill from left to right and reset */}
              {index === currentStepIndex && currentStepIndex < WORKFLOW_STEPS.length - 1 && (
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{
                    animation: 'fillAndReset 2s ease-in-out infinite'
                  }}
                />
              )}
            </div>
            
            {/* Arrow indicator for active connection */}
            {index === currentStepIndex && (
              <div className="absolute right-0 transform translate-x-1">
                <div className="w-0 h-0 border-l-4 border-l-blue-500 border-t-2 border-t-transparent border-b-2 border-b-transparent animate-pulse" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6", className)}>
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Task Progress
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current status: {currentStep.label}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center w-full">
          {WORKFLOW_STEPS.map((step, index) => renderStep(step, index))}
        </div>
      </div>


    </>
  );
};

export default TaskStepIndicator;
