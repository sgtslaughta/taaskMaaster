/**
 * @fileoverview Dashboard page component for TaaskMaaster
 * @description A comprehensive dashboard with welcome section, stats, progress, and gamification elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Card,
  Text,
  Group,
  Stack,
  Button,
  Grid,
  Loader,
  Alert,
  ThemeIcon,
  Title,
  Paper,
  Divider,
  Center,
  Badge,
  Gradient
} from '@mantine/core';
import { 
  IconHome,
  IconCheckbox,
  IconTrophy,
  IconUsers,
  IconChartBar,
  IconCalendar,
  IconStar,
  IconFlame,
  IconSchool,
  IconSettings
} from '@tabler/icons-react';
import { AppLayout } from '../layout/AppLayout';
import { gamificationService, goalService, taskService } from '../../services';
import { workflowStatsService, type WorkflowStats } from '../../services/workflowStatsService';
import WorkflowStatsCards from '../workflow/WorkflowStatsCards';

/**
 * @description User interface
 */
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role?: string;
  points?: number;
  level?: number;
}

/**
 * @description Dashboard statistics interface
 */
interface DashboardStats {
  totalPoints: number;
  currentLevel: number;
  tasksCompleted: number;
  tasksPending: number;
  streakDays: number;
  achievements: number;
  activeGoals: number;
  completedGoals: number;
}

/**
 * @description Recent activity interface
 */
interface RecentActivity {
  id: string;
  type: 'task_completed' | 'points_earned' | 'achievement_unlocked' | 'goal_reached';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

/**
 * @description Dashboard component props interface
 */
export interface DashboardProps {
  /** User information */
  user?: User | null;
  /** Function called when a quick action is performed */
  onQuickAction?: (action: string) => void;
  /** Function called when logout is requested */
  onLogout?: () => void;
  /** Function called when navigation is requested */
  onNavigation?: (view: string) => void;
  /** Function called when navigating from notifications */
  onNotificationNavigation?: (pageId: string, taskId?: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether this dashboard is embedded (e.g., in My Hub) */
  isEmbedded?: boolean;
}


/**
 * @description Dashboard component
 * 
 * A comprehensive dashboard that provides:
 * - Welcome section with user greeting
 * - Quick stats and progress overview
 * - Recent activity feed
 * - Quick action buttons
 * - Gamification progress indicators
 * - Dark mode support
 */
export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onQuickAction,
  onLogout,
  onNavigation,
  onNotificationNavigation,
  className,
  isEmbedded = false,
}) => {

  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    currentLevel: 1,
    tasksCompleted: 0,
    tasksPending: 0,
    streakDays: 0,
    achievements: 0,
    activeGoals: 0,
    completedGoals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * @description Load dashboard data
   */
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const userId = parseInt(user.id);
      
      // Load gamification stats
      const gamificationStats = await gamificationService.getDashboardStats(userId);
      
      // Load goal stats
      const goalStats = await goalService.getDashboardGoalStats();
      
      // Load task stats (using task service)
      const taskResponse = await taskService.getTasks();
      const allTasks = taskResponse.tasks;
      
      // Filter to only tasks for current user (created by OR assigned to)
      const userTasks = allTasks.filter(task => 
        task.created_by_id === userId || task.assigned_to_id === userId
      );
      
      const tasksCompleted = userTasks.filter(t => t.status === 'done').length;
      const tasksPending = userTasks.filter(t => t.status !== 'done').length;

      // Calculate workflow statistics (use user tasks only)
      const workflowStatsData = workflowStatsService.calculateWorkflowStats(userTasks);
      setWorkflowStats(workflowStatsData);

      // Combine all stats
      setStats({
        totalPoints: gamificationStats.totalPoints,
        currentLevel: gamificationStats.currentLevel,
        tasksCompleted,
        tasksPending,
        streakDays: gamificationStats.streakDays,
        achievements: gamificationStats.achievements,
        activeGoals: goalStats.activeGoals,
        completedGoals: goalStats.completedGoals,
      });

      // Load recent activity
      await loadRecentActivity(userId);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @description Load recent activity
   */
  const loadRecentActivity = async (userId: number) => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent points transactions
      const pointsHistory = await gamificationService.getUserPointsHistory(userId, { limit: 5 });
      pointsHistory.points.forEach(point => {
        activities.push({
          id: `points_${point.id}`,
          type: 'points_earned',
          title: `Earned ${point.amount} points`,
          description: point.description || 'Points earned',
          timestamp: point.created_at,
          points: point.amount,
        });
      });

      // Get recent achievements
      const achievements = await gamificationService.getUserAchievements(userId);
      achievements.slice(0, 3).forEach(achievement => {
        activities.push({
          id: `achievement_${achievement.id}`,
          type: 'achievement_unlocked',
          title: `Unlocked "${achievement.achievement.name}"`,
          description: achievement.achievement.description,
          timestamp: achievement.awarded_at,
        });
      });

      // Sort by timestamp and take the most recent 5
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setRecentActivity(sortedActivities);
    } catch (err) {
      console.error('Error loading recent activity:', err);
      // Set some default activity if API fails
      setRecentActivity([
        {
          id: '1',
          type: 'task_completed',
          title: 'Completed task "Clean the kitchen"',
          description: 'Daily chore completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'points_earned',
          title: 'Earned 50 points',
          description: 'Points earned for completing daily goal',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          points: 50,
        },
        {
          id: '3',
          type: 'achievement_unlocked',
          title: 'Unlocked "Task Master"',
          description: 'Completed 10 tasks in a week',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    }
  };

  /**
   * @description Load data on component mount
   */
  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);


  /**
   * @description Get appropriate greeting based on time of day
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  /**
   * @description Format timestamp for display
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };


  const renderContent = (content: React.ReactNode) => {
    if (isEmbedded) {
      return content;
    }
    return (
      <AppLayout
        currentPage="dashboard"
        onNavigate={(pageId) => onNavigation?.(pageId)}
        user={user}
        onLogout={onLogout}
      >
        {content}
      </AppLayout>
    );
  };

  if (loading) {
    return renderContent(
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return renderContent(
      <Alert color="red" title="Error loading dashboard">
        <Text>{error}</Text>
        <Button 
          variant="subtle" 
          color="red" 
          size="sm" 
          mt="sm"
          onClick={loadDashboardData}
        >
          Try again
        </Button>
      </Alert>
    );
  }

  return renderContent(
    <Stack gap="xl">
        {/* Welcome Section */}
        <Paper
          p="xl"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-7) 100%)',
            color: 'white'
          }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} mb="sm" c="white">
                {getGreeting()}! 👋
              </Title>
              <Text c="blue.1">
                Ready to tackle today's tasks and earn some points?
              </Text>
            </div>
            <Group gap="xl" visibleFrom="md">
              <Stack align="center" gap={4}>
                <Text size="xl" fw={700} c="white">{stats.totalPoints}</Text>
                <Text size="sm" c="blue.1">Total Points</Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text size="xl" fw={700} c="white">{stats.currentLevel}</Text>
                <Text size="sm" c="blue.1">Level</Text>
              </Stack>
            </Group>
          </Group>
        </Paper>

        {/* Quick Actions */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onQuickAction?.('tasks')}
            >
              <Group>
                <ThemeIcon size="lg" color="blue" variant="light">
                  <IconCheckbox size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={500} size="sm">Create Task</Text>
                  <Text size="xs" c="dimmed">Add a new task</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onQuickAction?.('goals')}
            >
              <Group>
                <ThemeIcon size="lg" color="yellow" variant="light">
                  <IconTrophy size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={500} size="sm">Set Goal</Text>
                  <Text size="xs" c="dimmed">Create a new goal</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onQuickAction?.('family')}
            >
              <Group>
                <ThemeIcon size="lg" color="green" variant="light">
                  <IconUsers size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={500} size="sm">Family</Text>
                  <Text size="xs" c="dimmed">View family members</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onQuickAction?.('achievements')}
            >
              <Group>
                <ThemeIcon size="lg" color="violet" variant="light">
                  <IconStar size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={500} size="sm">Achievements</Text>
                  <Text size="xs" c="dimmed">View your badges</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Workflow Statistics */}
        {workflowStats && (
          <WorkflowStatsCards 
            stats={workflowStats} 
            loading={loading}
          />
        )}

        {/* Stats Grid */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon size="md" color="green" variant="light">
                  <IconCheckbox size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Tasks Completed</Text>
                  <Text size="xl" fw={700}>{stats.tasksCompleted}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon size="md" color="orange" variant="light">
                  <IconFlame size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Streak</Text>
                  <Text size="xl" fw={700}>{stats.streakDays} days</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon size="md" color="yellow" variant="light">
                  <IconStar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Achievements</Text>
                  <Text size="xl" fw={700}>{stats.achievements}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group>
                <ThemeIcon size="md" color="blue" variant="light">
                  <IconChartBar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500}>Pending Tasks</Text>
                  <Text size="xl" fw={700}>{stats.tasksPending}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Recent Activity */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">Recent Activity</Title>
          <Divider mb="md" />
          <Stack gap="md">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Group key={activity.id} justify="space-between" align="flex-start">
                  <Group align="flex-start" gap="sm">
                    <ThemeIcon
                      size="xs"
                      radius="xl"
                      color={
                        activity.type === 'task_completed' ? 'green' :
                        activity.type === 'points_earned' ? 'blue' :
                        activity.type === 'achievement_unlocked' ? 'yellow' :
                        'violet'
                      }
                    />
                    <Text size="sm">{activity.title}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {formatTimestamp(activity.timestamp)}
                  </Text>
                </Group>
              ))
            ) : (
              <Center py="xl">
                <Text size="sm" c="dimmed">No recent activity</Text>
              </Center>
            )}
          </Stack>
        </Card>
    </Stack>
  );
};
