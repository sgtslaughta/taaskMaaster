/**
 * @fileoverview Tasks Page Component for TaaskMaaster
 * @description Production tasks page with full task management functionality
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { TaskList, TaskForm, Task, TaskFormData } from '../tasks';
import { AppLayout } from '../layout/AppLayout';
import { Button } from '../../design-system/components/Button';
import { Card } from '../../design-system/components/Card';
import { getCommonBreadcrumbs } from '../navigation/Breadcrumb';
import { NavigationItem } from '../navigation/Sidebar';

/**
 * @description Tasks page component props
 */
export interface TasksPageProps {
  /**
   * @description User data
   */
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Navigation items
   */
  navigationItems?: NavigationItem[];
  /**
   * @description Function to handle logout
   */
  onLogout?: () => void;
  /**
   * @description Function to handle navigation
   */
  onNavigation?: (item: NavigationItem) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Mock API functions for task management
 */
const mockApi = {
  /**
   * @description Fetch tasks from API
   */
  fetchTasks: async (): Promise<Task[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return [
      {
        id: '1',
        title: 'Complete homework assignment',
        description: 'Finish the math homework due tomorrow. Complete all problems in chapters 5-7.',
        status: 'pending',
        priority: 'high',
        category: 'Education',
        tags: ['homework', 'math', 'urgent'],
        assignedTo: 'Alex',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        points: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Clean bedroom',
        description: 'Organize toys, make bed, and vacuum the floor.',
        status: 'in_progress',
        priority: 'medium',
        category: 'Chores',
        tags: ['cleaning', 'bedroom'],
        assignedTo: 'Alex',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        points: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [
          { id: '2.1', title: 'Make bed', status: 'completed' as const },
          { id: '2.2', title: 'Organize toys', status: 'in_progress' as const },
          { id: '2.3', title: 'Vacuum floor', status: 'pending' as const },
        ],
      },
      {
        id: '3',
        title: 'Read for 30 minutes',
        description: 'Read the assigned book for today\'s reading goal.',
        status: 'completed',
        priority: 'low',
        category: 'Education',
        tags: ['reading', 'daily'],
        assignedTo: 'Alex',
        dueDate: new Date().toISOString(),
        points: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Practice piano',
        description: 'Practice the new song for 20 minutes.',
        status: 'overdue',
        priority: 'medium',
        category: 'Activities',
        tags: ['music', 'practice'],
        assignedTo: 'Alex',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        points: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  /**
   * @description Create new task
   */
  createTask: async (taskData: TaskFormData): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      category: taskData.category,
      tags: taskData.tags,
      assignedTo: taskData.assignedTo,
      dueDate: taskData.dueDate,
      points: taskData.points,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: taskData.attachments?.map(f => f.name),
      parentTaskId: taskData.parentTaskId,
      subtasks: taskData.subtasks as Task[],
    };
    
    return newTask;
  },

  /**
   * @description Update existing task
   */
  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would update the task in the database
    return { ...updates, id: taskId } as Task;
  },

  /**
   * @description Delete task
   */
  deleteTask: async (taskId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // In a real app, this would delete the task from the database
  },
};

/**
 * @description Tasks page component
 * @param props - Tasks page component props
 * @returns Tasks page component
 */
export const TasksPage: React.FC<TasksPageProps> = ({
  user,
  navigationItems = [],
  onLogout,
  onNavigation,
  className,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  // Mock data for form options
  const categories = ['Education', 'Chores', 'Activities', 'Health', 'Family'];
  const users = [
    { id: '1', name: 'Alex', role: 'child' },
    { id: '2', name: 'Mom', role: 'parent' },
    { id: '3', name: 'Dad', role: 'parent' },
  ];

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  /**
   * @description Load tasks from API
   */
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await mockApi.fetchTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Handle task creation
   */
  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  /**
   * @description Handle task form submission
   */
  const handleTaskSubmit = async (taskData: TaskFormData) => {
    try {
      setFormLoading(true);
      
      if (editingTask) {
        // Update existing task
        const updatedTask = await mockApi.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
      } else {
        // Create new task
        const newTask = await mockApi.createTask(taskData);
        setTasks(prev => [newTask, ...prev]);
      }
      
      setIsFormOpen(false);
      setEditingTask(undefined);
    } catch (err) {
      console.error('Error saving task:', err);
      // In a real app, you'd show an error message to the user
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * @description Handle task update
   */
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    ));
  };

  /**
   * @description Handle task deletion
   */
  const handleTaskDelete = async (taskId: string) => {
    try {
      await mockApi.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      // In a real app, you'd show an error message to the user
    }
  };

  /**
   * @description Handle task status change
   */
  const handleStatusChange = (taskId: string, status: Task['status']) => {
    handleTaskUpdate(taskId, { status });
  };

  /**
   * @description Handle task assignment
   */
  const handleTaskAssign = (taskId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      handleTaskUpdate(taskId, { assignedTo: user.name });
    }
  };

  /**
   * @description Handle task edit
   */
  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <AppLayout
      user={user}
      title="Tasks"
      subtitle="Manage your family's tasks and responsibilities"
      breadcrumbs={getCommonBreadcrumbs('tasks')}
      navigationItems={navigationItems}
      onLogout={onLogout}
      onNavigation={onNavigation}
      className={className}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600 mt-1">
              Organize, track, and complete tasks as a family
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadTasks}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTask}
            >
              Create Task
            </Button>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <Card.CardBody className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </Card.CardBody>
          </Card>

          <Card>
            <Card.CardBody className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
              </div>
            </Card.CardBody>
          </Card>

          <Card>
            <Card.CardBody className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-sm font-medium">🔄</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </Card.CardBody>
          </Card>

          <Card>
            <Card.CardBody className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-medium">⏰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {tasks.filter(t => t.status === 'overdue').length}
                  </p>
                </div>
              </div>
            </Card.CardBody>
          </Card>
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onCreateTask={handleCreateTask}
          onUpdateTask={handleTaskUpdate}
          onDeleteTask={handleTaskDelete}
          onStatusChange={handleStatusChange}
          onAssignTask={handleTaskAssign}
        />

        {/* Task Form Modal */}
        <TaskForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTask(undefined);
          }}
          onSubmit={handleTaskSubmit}
          task={editingTask}
          loading={formLoading}
          categories={categories}
          users={users}
          parentTasks={tasks.filter(t => !t.parentTaskId)}
        />
      </div>
    </AppLayout>
  );
};
