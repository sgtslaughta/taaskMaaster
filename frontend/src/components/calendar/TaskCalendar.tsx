import React, { useState, useMemo } from 'react';
import {
  Card,
  Group,
  ActionIcon,
  Text,
  Stack,
  Badge,
  Tooltip,
  Modal,
  Box,
  ScrollArea,
  useMantineTheme
} from '@mantine/core';
import classes from './TaskCalendar.module.css';
import { Calendar } from '@mantine/dates';
import { 
  IconChevronLeft, 
  IconChevronRight,
  IconCalendar,
  IconClock,
  IconUser,
  IconFlag
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Task, TaskStatus, TaskPriority } from '../../services/taskService';
import { TaskDrawer } from '../tasks/TaskDrawer';
import { TaskCreateRequest, TaskUpdateRequest } from '../../types/task';
import { User } from '../../types/user';
import { taskService } from '../../services';
import { notifications } from '@mantine/notifications';

interface TaskCalendarProps {
  tasks: Task[];
  currentUser?: User;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
  className?: string;
}

interface TaskEvent {
  task: Task;
  date: string;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
  spanDays: number;
  dayIndex?: number; // Position within the span
  weekRow?: number; // Which week row this event is on
  startCol?: number; // Starting column (0-6)
  endCol?: number; // Ending column (0-6)
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, currentUser, onTaskClick, onTaskUpdate, className }) => {
  const [currentDate, setCurrentDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'create' | 'edit'>('view');
  const [dayModalOpened, setDayModalOpened] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<TaskEvent[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const theme = useMantineTheme();

  // Process tasks into calendar events
  const taskEvents = useMemo(() => {
    const events: TaskEvent[] = [];
    
    // Get current month's start and end for filtering
    const monthStart = dayjs(currentDate).startOf('month').subtract(7, 'days'); // Include previous week for spanning tasks
    const monthEnd = dayjs(currentDate).endOf('month').add(7, 'days'); // Include next week for spanning tasks
    
    tasks.forEach(task => {
      const startDate = task.created_at ? dayjs(task.created_at).startOf('day') : dayjs().startOf('day');
      const endDate = task.due_date ? dayjs(task.due_date).startOf('day') : startDate;
      
      // Skip tasks that don't overlap with the visible month range
      if (endDate.valueOf() < monthStart.valueOf() || startDate.valueOf() > monthEnd.valueOf()) {
        return;
      }
      
      // If same day, just add one event
      if (startDate.format('YYYY-MM-DD') === endDate.format('YYYY-MM-DD')) {
        events.push({
          task,
          date: startDate.format('YYYY-MM-DD'),
          isStart: true,
          isEnd: true,
          isMiddle: false,
          spanDays: 1
        });
      } else {
        // Multi-day task - add events for each day
        let current = startDate;
        const totalDays = endDate.diff(startDate, 'day') + 1;
        
        while (current.valueOf() <= endDate.valueOf()) {
          // Only add events for days within our visible range
          if (current.valueOf() >= monthStart.valueOf() && current.valueOf() <= monthEnd.valueOf()) {
            events.push({
              task,
              date: current.format('YYYY-MM-DD'),
              isStart: current.format('YYYY-MM-DD') === startDate.format('YYYY-MM-DD'),
              isEnd: current.format('YYYY-MM-DD') === endDate.format('YYYY-MM-DD'),
              isMiddle: current.format('YYYY-MM-DD') !== startDate.format('YYYY-MM-DD') && current.format('YYYY-MM-DD') !== endDate.format('YYYY-MM-DD'),
              spanDays: totalDays
            });
          }
          current = current.add(1, 'day');
        }
      }
    });
    
    return events;
  }, [tasks, currentDate]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return taskEvents.filter(event => event.date === dateStr);
  };

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'red';
      case TaskPriority.HIGH: return 'orange';
      case TaskPriority.MEDIUM: return 'yellow';
      case TaskPriority.LOW: return 'green';
      default: return 'gray';
    }
  };

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return 'green';
      case TaskStatus.IN_PROGRESS: return 'blue';
      case TaskStatus.REVIEW: return 'yellow';
      case TaskStatus.TODO: return 'gray';
      case TaskStatus.CANCELLED: return 'red';
      default: return 'gray';
    }
  };

  // Handle task click
  const handleTaskClick = (taskEvent: TaskEvent) => {
    setSelectedTask(taskEvent.task);
    setDrawerMode('view');
    setDrawerOpened(true);
    setError('');
    onTaskClick?.(taskEvent.task);
  };

  // Handle day click (for all tasks)
  const handleDayClick = (date: Date, dayTasks: TaskEvent[]) => {
    if (dayTasks.length > 0) {
      setSelectedDayTasks(dayTasks);
      setSelectedDayDate(date);
      setDayModalOpened(true);
    }
  };

  // Handle task save
  const handleTaskSave = async (taskData: TaskCreateRequest | TaskUpdateRequest) => {
    try {
      setLoading(true);
      setError('');
      let savedTask;

      if (drawerMode === 'create') {
        // Create new task
        const createData = {
          ...taskData,
          status: taskData.status as any
        };
        savedTask = await taskService.createTask(createData as any);
        notifications.show({
          title: 'Success',
          message: 'Task created successfully!',
          color: 'green'
        });
      } else if (selectedTask) {
        // If we have a selectedTask, it's an update (regardless of drawerMode)
        // Update existing task
        const updateData = {
          ...taskData,
          status: taskData.status as any
        };
        savedTask = await taskService.updateTask(selectedTask.id, updateData as any);
        notifications.show({
          title: 'Success',
          message: 'Task updated successfully!',
          color: 'green'
        });
      }

      // Trigger cache invalidation by calling onTaskUpdate with the saved task
      if (savedTask) {
        onTaskUpdate?.(savedTask);
      }

      setDrawerOpened(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to save task. Please try again.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle task delete
  const handleTaskDelete = async (taskId: number) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      notifications.show({
        title: 'Success',
        message: 'Task deleted successfully!',
        color: 'green'
      });
      setDrawerOpened(false);
      onTaskUpdate?.(selectedTask!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.show({
        title: 'Error',
        message: 'Failed to delete task. Please try again.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpened(false);
    setSelectedTask(null);
    setError('');
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = dayjs(currentDate).add(direction === 'next' ? 1 : -1, 'month').format('YYYY-MM-DD');
    setCurrentDate(newDate);
  };

  // Custom day renderer
  const renderDay = (date: string) => {
    const dateObj = dayjs(date).toDate();
    const dayTasks = getTasksForDate(dateObj);
    const isToday = dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    
    return (
      <Box 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          minHeight: '80px',
          cursor: dayTasks.length > 0 ? 'pointer' : 'default'
        }}
        onClick={(e) => {
          if (dayTasks.length > 0) {
            e.stopPropagation();
            handleDayClick(dateObj, dayTasks);
          }
        }}
      >
        <Text 
          size="sm" 
          fw={isToday ? 700 : 400}
          c={isToday ? 'blue' : 'inherit'}
          mb="xs"
        >
          {dayjs(date).date()}
        </Text>
        
        <div className={classes.taskContainer}>
          {dayTasks.slice(0, 3).map((taskEvent, index) => {
            const task = taskEvent.task;
            const priorityColor = getPriorityColor(task.priority);
            const isCompleted = task.status === TaskStatus.DONE;
            
            return (
              <Tooltip
                key={`${task.id}-${index}`}
                label={
                  <div>
                    <Text size="sm" fw={500}>{task.title}</Text>
                    <Text size="xs" c="dimmed">
                      Priority: {task.priority} | Status: {task.status}
                    </Text>
                    {task.due_date && (
                      <Text size="xs" c="dimmed">
                        Due: {dayjs(task.due_date).format('MMM DD')}
                      </Text>
                    )}
                    {taskEvent.spanDays > 1 && (
                      <Text size="xs" c="dimmed">
                        Spans {taskEvent.spanDays} days
                      </Text>
                    )}
                  </div>
                }
                withArrow
              >
                <Badge
                  size="xs"
                  color={priorityColor}
                  variant="filled"
                  className={`${classes.taskBadge} ${
                    isCompleted ? classes.taskBadgeCompleted : ''
                  } ${
                    taskEvent.isStart && taskEvent.isEnd ? classes.taskBadgeSingle :
                    taskEvent.isStart ? classes.taskBadgeStart :
                    taskEvent.isEnd ? classes.taskBadgeEnd :
                    classes.taskBadgeMiddle
                  }`}
                  style={{
                    borderRadius: taskEvent.isStart && taskEvent.isEnd ? '4px' : 
                               taskEvent.isStart ? '4px 0 0 4px' :
                               taskEvent.isEnd ? '0 4px 4px 0' : '0',
                    zIndex: 1 // Ensure badges appear above day borders
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick(taskEvent);
                  }}
                >
                  {taskEvent.isStart || taskEvent.spanDays === 1 ? 
                    task.title.substring(0, 12) + (task.title.length > 12 ? '...' : '') : 
                    '···'
                  }
                </Badge>
              </Tooltip>
            );
          })}
          
          {dayTasks.length > 3 && (
            <div 
              className={classes.moreText}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={(e) => {
                e.stopPropagation();
                handleDayClick(dateObj, dayTasks);
              }}
            >
              +{dayTasks.length - 3} more
            </div>
          )}
        </div>
      </Box>
    );
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder className={className} style={{ width: '100%' }}>
      {/* Calendar Header */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <IconCalendar size={20} color={theme.colors.blue[6]} />
          <Text fw={500} size="lg">Task Calendar</Text>
        </Group>
        
        <Group gap="xs">
          <ActionIcon 
            variant="subtle" 
            onClick={() => navigateMonth('prev')}
            aria-label="Previous month"
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          
          <Text fw={500} size="md" style={{ minWidth: '120px', textAlign: 'center' }}>
            {dayjs(currentDate).format('MMMM YYYY')}
          </Text>
          
          <ActionIcon 
            variant="subtle" 
            onClick={() => navigateMonth('next')}
            aria-label="Next month"
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Calendar */}
      <Box className={classes.calendarContainer}>
        <Calendar
          key={`calendar-${dayjs(currentDate).format('YYYY-MM')}`} // Force re-render on month change
          date={currentDate} // Control the displayed month
          onDateChange={(date: string) => setCurrentDate(date)}
          size="lg"
          renderDay={renderDay}
          classNames={{}}
          styles={{
            month: {
              width: '100%'
            },
            monthThead: {
              width: '100%'
            },
            monthRow: {
              width: '100%'
            },
            monthTbody: {
              width: '100%'
            },
            day: {
              height: '80px',
              padding: '4px',
              minWidth: '120px',
              width: '14.28%',
              overflow: 'visible',
              position: 'relative'
            },
            calendarHeader: {
              display: 'none'
            }
          }}
        />
      </Box>


      {/* Day Tasks Modal */}
      <Modal
        opened={dayModalOpened}
        onClose={() => setDayModalOpened(false)}
        title={
          selectedDayDate ? (
            <Group gap="sm">
              <IconCalendar size={16} />
              <Text fw={500}>
                {dayjs(selectedDayDate).format('MMMM DD, YYYY')} - {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''}
              </Text>
            </Group>
          ) : (
            'Day Tasks'
          )
        }
        size="md"
      >
        <ScrollArea h={400}>
          <Stack gap="sm">
            {selectedDayTasks.map((taskEvent, index) => {
              const task = taskEvent.task;
              const priorityColor = getPriorityColor(task.priority);
              const statusColor = getStatusColor(task.status);
              const isCompleted = task.status === TaskStatus.DONE;

              return (
                <Card 
                  key={`${task.id}-${index}`} 
                  withBorder 
                  padding="sm" 
                  radius="sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setDayModalOpened(false);
                    handleTaskClick(taskEvent);
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="sm">
                        <Badge
                          size="sm"
                          color={priorityColor}
                          variant="filled"
                          style={{
                            opacity: isCompleted ? 0.6 : 1,
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                        <Badge
                          size="sm"
                          color={statusColor}
                          variant="light"
                        >
                          {task.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </Group>
                      
                      <Text 
                        size="sm" 
                        fw={500}
                        style={{
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          opacity: isCompleted ? 0.7 : 1
                        }}
                      >
                        {task.title}
                      </Text>
                      
                      {task.description && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {task.description}
                        </Text>
                      )}

                      <Group gap="md">
                        {taskEvent.spanDays > 1 && (
                          <Group gap="xs">
                            <IconCalendar size={12} />
                            <Text size="xs" c="dimmed">
                              {taskEvent.isStart && 'Starts today'}
                              {taskEvent.isEnd && 'Ends today'}
                              {taskEvent.isMiddle && `Day ${dayjs(selectedDayDate).diff(dayjs(task.created_at), 'day') + 1} of ${taskEvent.spanDays}`}
                            </Text>
                          </Group>
                        )}
                        
                        {task.due_date && (
                          <Group gap="xs">
                            <IconClock size={12} />
                            <Text size="xs" c="dimmed">
                              Due {dayjs(task.due_date).format('MMM DD')}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </Stack>
                    
                    {task.points && (
                      <Badge variant="outline" size="sm">
                        {task.points}pt
                      </Badge>
                    )}
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </ScrollArea>
      </Modal>

      {/* Task Drawer */}
      <TaskDrawer
        opened={drawerOpened}
        onClose={handleDrawerClose}
        task={selectedTask as any}
        currentUser={currentUser}
        mode={drawerMode}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        loading={loading}
        error={error}
      />
    </Card>
  );
};

export default TaskCalendar;