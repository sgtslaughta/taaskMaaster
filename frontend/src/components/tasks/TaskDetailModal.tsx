/**
 * @fileoverview Task Detail Modal Component for TaaskMaaster
 * @description Enhanced task detail modal with inline editing capabilities
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { Card } from '../../design-system/components/Card';
import { Task } from './TaskList';
import { cn } from '../../design-system/utils/cn';
import { REWARD_TYPES } from './TaskForm';
import SimpleTaskComments from '../comments/SimpleTaskComments';
import TaskActivityTimeline from './TaskActivityTimeline';

import { User, UserRole, UserStatus } from '../../types/user';
import TaskStepIndicator from '../workflow/TaskStepIndicator';
import { commentService } from '../../services/commentService';
import { taskService } from '../../services/taskService';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

/**
 * @description Convert backend task to frontend task format
 */
const adaptBackendToFrontendTask = (backendTask: any): Task => {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description,
    status: backendTask.status,
    priority: backendTask.priority,
    dueDate: backendTask.due_date,
    estimatedHours: backendTask.estimated_hours,
    actualHours: backendTask.actual_hours,
    points: backendTask.points || 0,
    tags: backendTask.tags || [],
    assignedTo: backendTask.assigned_to ? {
      id: backendTask.assigned_to.id,
      username: backendTask.assigned_to.username,
      email: backendTask.assigned_to.email,
      firstName: backendTask.assigned_to.first_name,
      lastName: backendTask.assigned_to.last_name
    } : undefined,
    createdById: backendTask.created_by_id,
    assignedToId: backendTask.assigned_to_id,
    categoryId: backendTask.category_id,
    templateId: backendTask.template_id,
    parentTaskId: backendTask.parent_task_id,
    createdAt: backendTask.created_at,
    updatedAt: backendTask.updated_at,
    rewardType: backendTask.reward_type,
    rewardValue: backendTask.reward_value,
    rewardDescription: backendTask.reward_description,
    isRecurring: backendTask.is_recurring || false,
    recurrencePattern: backendTask.recurrence_pattern,
    category: backendTask.category,
    template: backendTask.template,
    dependencies: backendTask.dependencies || [],
    mediaAttachments: backendTask.media_attachments || [],
    subtasks: backendTask.subtasks?.map(adaptBackendToFrontendTask) || [],
  };
};

/**
 * @description Task detail modal component props
 */
export interface TaskDetailModalProps {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Task to display
   */
  task?: Task;
  /**
   * @description Available users for assignment
   */
  users?: User[];
  /**
   * @description Available categories for assignment
   */
  categories?: string[];
  /**
   * @description Function to handle task update
   */
  onUpdateTask?: (taskId: number, updates: Partial<Task>) => void;
  /**
   * @description Function to handle task deletion
   */
  onDeleteTask?: (taskId: number) => void;
  /**
   * @description Function to handle task completion
   */
  onCompleteTask?: (taskId: number) => void;
  /**
   * @description Loading state
   */
  loading?: boolean;
  /**
   * @description Whether the current user can edit this task
   */
  canEdit?: boolean;
  /**
   * @description Current user information
   */
  currentUser?: { id: string; username: string; role?: string } | null;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Editable field component
 */
interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  editMode?: boolean;
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  options = [],
  editMode = false,
  className
}) => {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    onSave(newValue);
  };

  if (editMode) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        ) : type === 'select' ? (
          <select
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={editValue}
            onChange={(e) => handleChange(e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="text-sm text-gray-900 dark:text-white">
        {(() => {
          if (typeof value === 'string') {
            return value || 'Not set';
          } else if (value && typeof value === 'object') {
            return JSON.stringify(value);
          } else {
            return String(value) || 'Not set';
          }
        })()}
      </div>
    </div>
  );
};

/**
 * @description Task detail modal component
 * @param props - Task detail modal component props
 * @returns Task detail modal component
 */
export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  users = [],
  categories = [],
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  loading = false,
  canEdit = false,
  currentUser = null,
  className,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'messages'>('details');
  const [messageCount, setMessageCount] = useState<number>(0);

  // Default categories if none provided
  const defaultCategories = ['Household', 'Personal', 'Work', 'School', 'Health', 'Other'];
  const availableCategories = categories.length > 0 ? categories : defaultCategories;
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState<number>(0);

  // Load message count for badge when modal opens
  useEffect(() => {
    if (task && isOpen) {
      const loadMessageCount = async () => {
        try {
          const response = await commentService.getTaskComments(task.id, {
            limit: 1,
            include_system: false
          });
          setMessageCount(response.total || 0);
          // For now, assume all messages are "new" if we haven't loaded them yet
          if (!hasLoadedMessages) {
            setNewMessageCount(response.total || 0);
          }
        } catch (error) {
          console.warn('Failed to load message count:', error);
        }
      };
      loadMessageCount();
    } else if (!isOpen) {
      // Reset tab states when modal is closed
      setActiveTab('details');
      setHasLoadedMessages(false);
      setNewMessageCount(0);
      setMessageCount(0);
    }
  }, [task, isOpen, hasLoadedMessages]);

  if (!task) {
    return null;
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="w-5 h-5 text-blue-500" />;
      case 'submitted_for_approval':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'cancelled':
        return <StopIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getRewardDisplay = () => {
    if (!task.rewardType || task.rewardValue === 0) {
      return 'No reward';
    }

    const rewardType = REWARD_TYPES.find(type => type.value === task.rewardType);
    if (!rewardType) return 'No reward';

    let display = `${rewardType.icon} ${task.rewardValue}`;
    
    switch (task.rewardType) {
      case 'monetary':
        display += ' USD';
        break;
      case 'time':
        display += ' min';
        break;
      case 'points':
        display += ' pts';
        break;
      case 'custom':
        display = task.rewardDescription || 'Custom reward';
        break;
    }

    return display;
  };

  const handleFieldUpdate = (field: string, value: any) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = () => {
    if (onUpdateTask && task && Object.keys(editedTask).length > 0) {
      onUpdateTask(task.id, editedTask);
    }
    setIsEditMode(false);
    setEditedTask({});
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedTask({});
  };

  // Helper function to get current field value (edited or original)
  const getFieldValue = (field: keyof Task) => {
    return editedTask[field] !== undefined ? editedTask[field] : task[field];
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (isEditMode) {
      handleFieldUpdate('status', newStatus);
    } else {
      // Direct status change when not in edit mode
      if (onUpdateTask && task) {
        const updates = { status: newStatus };
        onUpdateTask(task.id, updates);
      }
    }
  };

  const handleComplete = () => {
    if (onCompleteTask && task) {
      onCompleteTask(task.id);
    }
  };

  const handleRefreshTask = async (taskId: number) => {
    try {
      // Fetch fresh task data from backend
      const updatedTask = await taskService.getTask(taskId);
      const frontendTask = adaptBackendToFrontendTask(updatedTask);
      
      // Update the task in the parent component
      if (onUpdateTask) {
        onUpdateTask(taskId, frontendTask);
      }
    } catch (error) {
      console.error('Error refreshing task:', error);
    }
  };

  const handleDelete = () => {
    if (onDeleteTask && task && confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
      className="dark:bg-gray-800 w-[75vw] max-w-none mx-auto"
    >
      <div className="max-h-[80vh] flex flex-col min-h-0">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-600 px-6 pt-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2",
                activeTab === 'details'
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
              )}
            >
              <InformationCircleIcon className="w-4 h-4" />
              <span>Details</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('messages');
                if (!hasLoadedMessages) {
                  setHasLoadedMessages(true);
                  setNewMessageCount(0); // Clear new message indicator when tab is opened
                }
              }}
              className={cn(
                "whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2",
                activeTab === 'messages'
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
              )}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>Messages</span>
              {newMessageCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {newMessageCount > 99 ? '99+' : newMessageCount}
                </span>
              )}
              {messageCount > 0 && newMessageCount === 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium leading-none text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full">
                  {messageCount > 99 ? '99+' : messageCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'details' && (
            <div className="space-y-4 p-4 pb-16">
          {/* Prominent Status Banners for Different States */}
          {currentUser && (
            (() => {
              const isTaskCreator = task.createdById === parseInt(currentUser.id);
              const isAssignedUser = task.assignedTo?.id === parseInt(currentUser.id);
              const isAdmin = currentUser.role === 'admin' || currentUser.role === 'organizer';
              const canApprove = isTaskCreator || isAdmin;
              
              // Banner for tasks awaiting approval (only show to approvers, not submitters)
              if (task.status === 'submitted_for_approval' && canApprove && !isAssignedUser) {
                return (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-l-4 border-orange-400 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-6 w-6 text-orange-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                          Ready for Review
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          Task marked complete by <strong>{task.assignedTo?.username || 'assignee'}</strong> and is awaiting your approval.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Banner for tasks ready to begin (only show to assignees)
              if (task.status === 'todo' && isAssignedUser && !isTaskCreator) {
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <PlayIcon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                          Ready to Begin
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This task has been assigned to you and is ready to start. Click the workflow step to begin working.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return null;
            })()
          )}
          
          {/* Task Workflow Step Indicator */}
          {currentUser && (
            <TaskStepIndicator
              task={task}
              currentUser={{
                id: parseInt(currentUser.id),
                username: currentUser.username,
                email: (currentUser as any).email || '',
                first_name: (currentUser as any).first_name || '',
                last_name: (currentUser as any).last_name || '',
                full_name: (currentUser as any).full_name || currentUser.username,
                role: (currentUser.role as UserRole) || UserRole.USER,
                status: UserStatus.ACTIVE,
                is_active: true,
                is_verified: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }}
              onTaskUpdate={(taskId, updates) => {
                onUpdateTask?.(taskId, updates);
              }}
              onRefreshTask={handleRefreshTask}
              onError={(error) => {
                console.error('Workflow error:', error);
              }}
            />
          )}

          {/* Header with Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(task.status)}
              <div>
                {isEditMode ? (
                  <Input
                    value={getFieldValue('title') as string}
                    onChange={(e) => handleFieldUpdate('title', e.target.value)}
                    className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:ring-2 focus:ring-blue-500 p-0"
                    placeholder="Task title"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getFieldValue('title') as string}
                  </h2>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(task.createdAt).toLocaleDateString()}
                </p>
                {!canEdit && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Read-only: You can only edit tasks you created or are assigned to
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  disabled={loading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit task details"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
              {isEditMode && (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={loading || Object.keys(editedTask).length === 0}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save changes"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cancel editing"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </>
              )}
              {canEdit && task.status !== 'done' && (
                (() => {
                  // Determine button text and action based on workflow
                  const isTaskCreator = currentUser && task.createdById === parseInt(currentUser.id);
                  const isAssignedUser = currentUser && task.assignedTo?.id === parseInt(currentUser.id);
                  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'organizer');
                  
                  let buttonTitle = 'Mark task as complete';
                  let buttonIcon = CheckCircleIcon;
                  let buttonClass = 'p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                  
                  if (task.status === 'submitted_for_approval') {
                    if (isTaskCreator || isAdmin) {
                      buttonTitle = 'Approve task completion';
                      buttonIcon = CheckCircleIcon;
                      buttonClass = 'p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                    } else {
                      return null; // Hide button if not creator/admin and task is pending approval
                    }
                  } else if (isAssignedUser && !isTaskCreator && !isAdmin) {
                    buttonTitle = 'Submit task for approval';
                    buttonIcon = PlayIcon;
                    buttonClass = 'p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                  }
                  
                  const IconComponent = buttonIcon;
                  
                  return (
                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className={buttonClass}
                      title={buttonTitle}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })()
              )}
              {canEdit && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete task permanently"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Core Details - Compact Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              {isEditMode ? (
                <select
                  value={getFieldValue('status') as string}
                  onChange={(e) => handleFieldUpdate('status', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted_for_approval">Submitted for Approval</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              ) : (
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {(getFieldValue('status') as string).replace('_', ' ')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Priority
              </label>
              {isEditMode ? (
                <select
                  value={getFieldValue('priority') as string}
                  onChange={(e) => handleFieldUpdate('priority', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              ) : (
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  getPriorityColor(task.priority)
                )}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Points
              </label>
              {isEditMode ? (
                <Input
                  type="number"
                  value={getFieldValue('points') as number || 0}
                  onChange={(e) => handleFieldUpdate('points', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs"
                  min="0"
                />
              ) : (
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {task.points || 0}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Hours
              </label>
              {isEditMode ? (
                <Input
                  type="number"
                  value={getFieldValue('estimatedHours') as number || 0}
                  onChange={(e) => handleFieldUpdate('estimatedHours', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs"
                  min="0"
                  step="0.5"
                />
              ) : (
                <div className="text-sm text-gray-900 dark:text-white font-medium">
                  {task.estimatedHours || 0}h
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <EditableField
            label="Description"
            value={(() => {
              const descValue = getFieldValue('description');
              return typeof descValue === 'string' ? descValue : (descValue?.toString() || task.description || '');
            })()}
            onSave={(value) => handleFieldUpdate('description', value)}
            type="textarea"
            editMode={isEditMode}
          />

          {/* Assignment and Timeline - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assigned To
              </label>
              {isEditMode ? (
                <select
                  value={(getFieldValue('assignedTo') as any)?.id?.toString() || ''}
                  onChange={(e) => {
                    const selectedUser = users.find(u => u.id.toString() === e.target.value);
                    handleFieldUpdate('assignedTo', selectedUser || null);
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {(getFieldValue('assignedTo') as any)?.username || task.assignedTo?.username || 'Unassigned'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due Date
              </label>
              {isEditMode ? (
                <Input
                  type="datetime-local"
                  value={getFieldValue('dueDate') ? new Date(getFieldValue('dueDate') as string).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleFieldUpdate('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-2 py-1 text-xs"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {getFieldValue('dueDate') ? new Date(getFieldValue('dueDate') as string).toLocaleString() : 'No due date'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category - Compact */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Category
            </label>
            {isEditMode ? (
              <select
                value={(getFieldValue('category') as any)?.name || ''}
                onChange={(e) => {
                  const categoryName = e.target.value;
                  handleFieldUpdate('category', categoryName ? { name: categoryName } : null);
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Uncategorized</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center space-x-2">
                <TagIcon className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">
                  {(getFieldValue('category') as any)?.name || task.category?.name || 'Uncategorized'}
                </span>
              </div>
            )}
          </div>

          {/* Tags - Compact */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {typeof tag === 'string' ? tag : (tag as any)?.name || JSON.stringify(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks - Compact */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Subtasks ({task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length})
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {task.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={subtask.status === 'done'}
                      onChange={() => {
                        // Handle subtask status change
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                    />
                    <span className={cn(
                      "flex-1 text-xs",
                      subtask.status === 'done' 
                        ? "text-gray-500 line-through" 
                        : "text-gray-900 dark:text-white"
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline - Scrollable */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Activity History
            </label>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-800">
                <TaskActivityTimeline 
                  taskId={task.id}
                  currentUser={currentUser ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: '', // We'll need to get this from the user object if needed
                    role: currentUser.role
                  } : undefined}
                  className="relative"
                />
              </div>
            </div>
          </div>
            </div>
          )}

          {activeTab === 'messages' && currentUser && hasLoadedMessages && (
            <div className="h-full flex flex-col p-4 pb-8">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Task Discussion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Collaborate with team members on this task
                </p>
              </div>
              <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <SimpleTaskComments
                  taskId={task.id}
                  currentUser={{
                    id: parseInt(currentUser.id),
                    username: currentUser.username,
                    email: '', // We'll need to get this from the user object
                    first_name: currentUser.username,
                    last_name: '',
                    full_name: currentUser.username,
                    role: (currentUser.role as UserRole) || UserRole.USER,
                    status: 'active' as any,
                    is_active: true,
                    is_verified: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }}
                  maxHeight={400}
                  allowRichText={true}
                  allowMediaUpload={true}
                  showTypingIndicators={true}
                  autoScrollToBottom={true}
                />
              </div>
            </div>
          )}

          {activeTab === 'messages' && currentUser && !hasLoadedMessages && (
            <div className="flex items-center justify-center h-64 p-4">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Messages will load when you first view this tab
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Click the Messages tab to start the discussion
                </p>
              </div>
            </div>
          )}

          {activeTab === 'messages' && !currentUser && (
            <div className="flex items-center justify-center h-64 p-4">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Authentication Required
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You must be logged in to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
