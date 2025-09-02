/**
 * @fileoverview Lists Tab Component for TaaskMaaster
 * @description Task lists tab for organizing tasks into custom groups (Phase 4)
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { Modal } from '../../../design-system/components/Modal';
import { Input } from '../../../design-system/components/Input';
import { cn } from '../../../design-system/utils/cn';
import { ListService, TaskList, TaskListCreate, TaskListUpdate, TaskListStats } from '../../../services/listService';
import { taskService, Task } from '../../../services/taskService';
import {
  PlusIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

/**
 * @description Lists tab component props
 */
export interface ListsTabProps {
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Create/Edit List Modal Props
 */
interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (list: TaskListCreate | TaskListUpdate) => void;
  list?: TaskList;
  mode: 'create' | 'edit';
}

/**
 * @description Create/Edit List Modal Component
 */
const ListModal: React.FC<ListModalProps> = ({ isOpen, onClose, onSave, list, mode }) => {
  const [formData, setFormData] = useState<TaskListCreate>({
    name: '',
    description: '',
    color: '#3B82F6',
    is_public: false,
  });

  useEffect(() => {
    if (list && mode === 'edit') {
      setFormData({
        name: list.name,
        description: list.description || '',
        color: list.color,
        is_public: list.is_public,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        is_public: false,
      });
    }
  }, [list, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const colorVariants = ListService.getColorVariants();

  return (
         <Modal 
           isOpen={isOpen} 
           onClose={onClose} 
           title={mode === 'create' ? 'Create New List' : 'Edit List'}
           showCloseButton={true}
           closeOnBackdropClick={true}
           closeOnEscape={true}
         >
       <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            List Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter list name"
            required
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter list description"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  formData.color === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                title={`Select ${color} color`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_public"
            checked={formData.is_public}
            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
          />
          <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Make this list public (shareable)
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === 'create' ? 'Create List' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * @description List Card Component
 */
interface ListCardProps {
  list: TaskList;
  onEdit: (list: TaskList) => void;
  onDelete: (listId: number) => void;
  onArchive: (listId: number) => void;
  onView: (list: TaskList) => void;
}

const ListCard: React.FC<ListCardProps> = ({ list, onEdit, onDelete, onArchive, onView }) => {
  const completionPercentage = ListService.getCompletionPercentage(list.task_count, list.completed_task_count);

     return (
     <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => onView(list)}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: list.color }}
            />
                         <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
               {list.name}
             </h3>
            {list.is_public && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Public
              </span>
            )}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(list);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Edit list"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(list.id);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Archive list"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(list.id);
              }}
              className="p-1 text-red-400 hover:text-red-600 transition-colors"
              title="Delete list"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {list.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {list.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {list.task_count} tasks
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {list.completed_task_count} completed
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: list.color,
              }}
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {completionPercentage}% complete
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * @description List Detail View Component
 */
interface ListDetailViewProps {
  list: TaskList | null;
  onClose: () => void;
  onAddTask: (list: TaskList) => void;
  onRemoveTask: (listId: number, taskId: number) => void;
}

const ListDetailView: React.FC<ListDetailViewProps> = ({ list, onClose, onAddTask, onRemoveTask }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (list) {
      loadListTasks();
    }
  }, [list?.id]); // Add dependency on list.id to ensure it reloads when list changes

  const loadListTasks = async () => {
    if (!list) return;
    
    setLoading(true);
    try {
      console.log('Loading tasks for list:', list.id);
      const listWithTasks = await ListService.getTaskList(list.id);
      console.log('Received list with tasks:', listWithTasks);
      setTasks(listWithTasks.tasks || []);
    } catch (error) {
      console.error('Error loading list tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (!list) return null;

     return (
     <Modal 
       isOpen={!!list} 
       onClose={onClose} 
       title={`${list.name} - ${list.task_count} tasks`}
       showCloseButton={true}
       closeOnBackdropClick={true}
       closeOnEscape={true}
     >
       <div className="space-y-4 text-gray-900 dark:text-white">
        {list.description && (
          <p className="text-gray-600 dark:text-gray-400">{list.description}</p>
        )}

                 <div className="flex justify-between items-center">
           <div className="flex items-center space-x-2">
             <div
               className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
               style={{ backgroundColor: list.color }}
               title={`List color: ${list.color}`}
             />
             <span className="text-sm text-gray-600 dark:text-gray-400">
               {list.is_public ? 'Public List' : 'Private List'}
             </span>
           </div>
                          <button
                  onClick={() => {
                    onAddTask(list);
                    onClose();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Add task to list"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No tasks in this list yet.</p>
                                         <Button
                  onClick={() => {
                    onAddTask(list);
                    onClose();
                  }}
                  className="mt-2"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Tasks
                </Button>
          </div>
        ) : (
                     <div className="space-y-2 max-h-96 overflow-y-auto">
             {tasks.map((task) => (
               <div
                 key={task.id}
                 className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
               >
                <div className="flex items-center space-x-3">
                                     <button
                     onClick={async () => {
                       try {
                         await taskService.updateTask(task.id, {
                           status: task.status === 'done' ? 'todo' : 'done'
                         });
                         // Refresh the tasks after updating
                         await loadListTasks();
                       } catch (error) {
                         console.error('Error updating task:', error);
                       }
                     }}
                     className={cn(
                       "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                       task.status === 'done'
                         ? "bg-blue-600 border-blue-600 text-white"
                         : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
                     )}
                     title={task.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
                   >
                     {task.status === 'done' && <CheckIcon className="w-3 h-3" />}
                   </button>
                  <div>
                    <p className={cn(
                      "font-medium",
                      task.status === 'done' && "line-through text-gray-500"
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                                 <button
                   onClick={() => onRemoveTask(list.id, task.id)}
                   className="text-red-400 hover:text-red-600 p-1 transition-colors"
                   title="Remove task from list"
                 >
                   <XMarkIcon className="w-4 h-4" />
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * @description Lists tab component
 * @param props - Lists tab component props
 * @returns Lists tab component
 */
export const ListsTab: React.FC<ListsTabProps> = ({ className }) => {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [stats, setStats] = useState<TaskListStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  
  // Modal states
  const [listModal, setListModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    list?: TaskList;
  }>({ isOpen: false, mode: 'create' });
  
  const [selectedList, setSelectedList] = useState<TaskList | null>(null);
  
  // Task selection state
  const [isTaskSelectionOpen, setIsTaskSelectionOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [taskSelectionLoading, setTaskSelectionLoading] = useState(false);
  const [currentListForTask, setCurrentListForTask] = useState<TaskList | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadLists();
    loadStats();
  }, [showArchived]);

  const loadLists = async () => {
    try {
      const data = await ListService.getTaskLists(0, 100, showArchived);
      setLists(data);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await ListService.getListStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateList = async (listData: TaskListCreate) => {
    try {
      await ListService.createTaskList(listData);
      setListModal({ isOpen: false, mode: 'create' });
      loadLists();
      loadStats();
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleUpdateList = async (listData: TaskListUpdate) => {
    if (!listModal.list) return;
    
    try {
      await ListService.updateTaskList(listModal.list.id, listData);
      setListModal({ isOpen: false, mode: 'create' });
      loadLists();
      loadStats();
    } catch (error) {
      console.error('Error updating list:', error);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ListService.deleteTaskList(listId);
      loadLists();
      loadStats();
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleArchiveList = async (listId: number) => {
    try {
      await ListService.archiveTaskList(listId);
      loadLists();
      loadStats();
    } catch (error) {
      console.error('Error archiving list:', error);
    }
  };

  const handleAddTask = async (list: TaskList) => {
    setCurrentListForTask(list);
    setTaskSelectionLoading(true);
    setIsTaskSelectionOpen(true);
    
    try {
      // Fetch fresh list data to ensure we have the latest task list
      const freshList = await ListService.getTaskList(list.id);
      
      // Fetch all available tasks
      const response = await taskService.getTasks({ limit: 100 });
      const allTasks = response.tasks;
      
      // Filter out tasks that are already in this list
      const tasksInList = freshList.tasks || [];
      const tasksInListIds = tasksInList.map(task => task.id);
      const availableTasks = allTasks.filter(task => !tasksInListIds.includes(task.id));
      
      setAvailableTasks(availableTasks);
      setSelectedTaskIds([]);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setTaskSelectionLoading(false);
    }
  };

  const handleTaskSelectionSubmit = async () => {
    if (!currentListForTask || selectedTaskIds.length === 0) return;
    
    setTaskSelectionLoading(true);
    try {
      // Add selected tasks to the list
      const results = await Promise.allSettled(
        selectedTaskIds.map(taskId => 
          ListService.addTaskToList(currentListForTask.id, { task_id: taskId })
        )
      );
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some tasks failed to add:', failures);
        // Still continue to refresh the list
      }
      
      // Refresh the lists to show the new tasks
      await loadLists();
      
      // If we have a selected list, refresh it too
      if (selectedList && selectedList.id === currentListForTask.id) {
        const updatedList = await ListService.getTaskList(selectedList.id);
        setSelectedList(updatedList);
      }
      
      // Close the modal
      setIsTaskSelectionOpen(false);
      setSelectedTaskIds([]);
      setCurrentListForTask(null);
    } catch (error) {
      console.error('Failed to add tasks to list:', error);
    } finally {
      setTaskSelectionLoading(false);
    }
  };

  const handleTaskSelectionCancel = () => {
    setIsTaskSelectionOpen(false);
    setSelectedTaskIds([]);
    setCurrentListForTask(null);
  };

  const handleTaskSelectionToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleRemoveTask = async (listId: number, taskId: number) => {
    try {
      await ListService.removeTaskFromList(listId, taskId);
      // Refresh the selected list
      if (selectedList) {
        const updatedList = await ListService.getTaskList(selectedList.id);
        setSelectedList(updatedList);
      }
    } catch (error) {
      console.error('Error removing task from list:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Lists</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Organize tasks into custom lists for better grouping and management.
          </p>
        </div>
        
        {stats && (
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">{stats.total_lists}</div>
              <div className="text-gray-600 dark:text-gray-400">Lists</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">{stats.total_tasks}</div>
              <div className="text-gray-600 dark:text-gray-400">Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white">{stats.completion_rate.toFixed(1)}%</div>
              <div className="text-gray-600 dark:text-gray-400">Complete</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setListModal({ isOpen: true, mode: 'create' })}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create New List
            </Button>
            <Button variant="secondary" onClick={() => setShowArchived(!showArchived)}>
              <ArchiveBoxIcon className="w-4 h-4 mr-2" />
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>📊 {lists.length} lists</span>
            {stats && <span>• {stats.total_tasks} total tasks</span>}
          </div>
        </div>
      </Card>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {showArchived ? 'No Archived Lists' : 'No Lists Yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {showArchived 
                ? 'You don\'t have any archived lists.'
                : 'Create your first list to start organizing tasks.'
              }
            </p>
                         {!showArchived && (
               <Button onClick={() => setListModal({ isOpen: true, mode: 'create' })}>
                 <PlusIcon className="w-4 h-4 mr-2" />
                 Create Your First List
               </Button>
             )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onEdit={(list) => setListModal({ isOpen: true, mode: 'edit', list })}
              onDelete={handleDeleteList}
              onArchive={handleArchiveList}
              onView={setSelectedList}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ListModal
        isOpen={listModal.isOpen}
        onClose={() => setListModal({ isOpen: false, mode: 'create' })}
        onSave={listModal.mode === 'create' ? handleCreateList : handleUpdateList}
        list={listModal.list}
        mode={listModal.mode}
      />

      <ListDetailView
        list={selectedList}
        onClose={() => setSelectedList(null)}
        onAddTask={handleAddTask}
        onRemoveTask={handleRemoveTask}
      />

      {/* Task Selection Modal */}
      <Modal
        isOpen={isTaskSelectionOpen}
        onClose={handleTaskSelectionCancel}
        title="Add Tasks to List"
        subtitle={currentListForTask ? `Select tasks to add to "${currentListForTask.name}"` : ''}
        showCloseButton={true}
        closeOnBackdropClick={true}
        closeOnEscape={true}
      >
        <div className="space-y-4">
          {taskSelectionLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading tasks...</p>
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No available tasks to add to this list.
              </p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedTaskIds.includes(task.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    )}
                    onClick={() => handleTaskSelectionToggle(task.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => handleTaskSelectionToggle(task.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
                    />
                    <div className="ml-3 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description.length > 100 
                            ? `${task.description.substring(0, 100)}...` 
                            : task.description
                          }
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className={cn(
                          "px-2 py-1 rounded-full",
                          task.status === 'done' ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" :
                          task.status === 'in_progress' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" :
                          task.status === 'todo' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" :
                          task.status === 'submitted_for_approval' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        )}>
                          {task.status === 'todo' ? 'Assigned' : 
                           task.status === 'submitted_for_approval' ? 'Pending Approval' :
                           task.status.replace('_', ' ')}
                        </span>
                        <span className={cn(
                          "px-2 py-1 rounded-full",
                          task.priority === 'high' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" :
                          task.priority === 'medium' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleTaskSelectionCancel}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTaskSelectionSubmit}
                    disabled={selectedTaskIds.length === 0 || taskSelectionLoading}
                  >
                    {taskSelectionLoading ? 'Adding...' : `Add ${selectedTaskIds.length} Task${selectedTaskIds.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
