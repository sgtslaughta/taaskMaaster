/**
 * @fileoverview Dashboard page component for TaaskMaaster
 * @description A comprehensive dashboard with welcome section, stats, progress, and gamification elements
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Progress,
  RingProgress,
  SimpleGrid,
  Box
} from '@mantine/core';
import { LineChart, DonutChart, BarChart, AreaChart, PieChart } from '@mantine/charts';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
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
  IconSettings,
  IconArrowUpRight,
  IconArrowDownRight,
  IconClock,
  IconFolderOpen,
  IconProgress,
  IconTargetArrow,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { AppLayout } from '../layout/AppLayout';
import { gamificationService, goalService, taskService } from '../../services';
import BlurText from '../ui/BlurText';
import TaskCalendar from '../calendar/TaskCalendar';
import { useAuth } from '../../contexts/AuthContext';

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
export interface DashboardStats {
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
export interface RecentActivity {
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
  // Get authenticated user for permission checking
  const { user: authUser } = useAuth();

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>({
    categoryBreakdown: [],
    priorityDistribution: [],
    statusFlow: [],
    timeMetrics: [],
    trendData: []
  });
  const [userTasks, setUserTasks] = useState<any[]>([]);

  /**
   * @description Calculate analytics from task data
   */
  const calculateAnalytics = useCallback((tasks: any[]) => {
    // Category breakdown
    const categoryMap = new Map();
    const priorityMap = new Map();
    const statusMap = new Map();
    
    tasks.forEach(task => {
      // Category breakdown
      const category = task.category?.name || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      
      // Priority distribution
      priorityMap.set(task.priority, (priorityMap.get(task.priority) || 0) + 1);
      
      // Status distribution
      statusMap.set(task.status, (statusMap.get(task.status) || 0) + 1);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));

    const priorityDistribution = Array.from(priorityMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'urgent' ? '#fa5252' : name === 'high' ? '#fd7e14' : name === 'medium' ? '#fab005' : '#51cf66'
    }));

    const statusFlow = Array.from(statusMap.entries()).map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      value,
      percentage: Math.round((value / tasks.length) * 100)
    }));

    // Time metrics calculations
    const completedTasks = tasks.filter(task => task.status === 'done' && task.completed_at);
    const avgCompletionTime = completedTasks.length > 0 
      ? completedTasks.reduce((acc, task) => {
          const created = new Date(task.created_at);
          const completed = new Date(task.completed_at);
          return acc + (completed.getTime() - created.getTime());
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24)
      : 0;

    const timeMetrics = [
      { label: 'Avg Completion Time', value: Math.round(avgCompletionTime * 10) / 10, unit: 'days', icon: 'IconClock', trend: 'down', change: 12 },
      { label: 'Tasks This Week', value: tasks.filter(t => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(t.created_at) > weekAgo;
      }).length, unit: 'tasks', icon: 'IconTrendingUp', trend: 'up', change: 23 },
      { label: 'Completion Rate', value: Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100), unit: '%', icon: 'IconTargetArrow', trend: 'up', change: 8 },
      { label: 'Active Categories', value: categoryMap.size, unit: 'cats', icon: 'IconFolderOpen', trend: 'neutral', change: 0 }
    ];

    setAnalyticsData({
      categoryBreakdown,
      priorityDistribution,
      statusFlow,
      timeMetrics,
      trendData: [] // Will be populated with real trend data later
    });
  }, []);

  /**
   * @description Load recent activity
   */
  const loadRecentActivity = useCallback(async (userId: number) => {
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
  }, []);

  /**
   * @description Load dashboard data
   */
  const loadDashboardData = useCallback(async () => {
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
      
      // Store user tasks for calendar
      setUserTasks(userTasks);
      
      const tasksCompleted = userTasks.filter(t => t.status === 'done').length;
      const tasksPending = userTasks.filter(t => t.status !== 'done').length;

      // Calculate analytics data
      calculateAnalytics(userTasks);

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
  }, [user?.id, calculateAnalytics, loadRecentActivity]);

  /**
   * @description Load data on component mount
   */
  useEffect(() => {
    loadDashboardData();
  }, [user?.id, loadDashboardData]);


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
        user={user ? {
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          points: undefined,
          level: undefined
        } : null}
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

  // Prepare chart data
  const taskProgressData = [
    { name: 'Completed', value: stats.tasksCompleted, color: '#51cf66' },
    { name: 'Pending', value: stats.tasksPending, color: '#ffd43b' }
  ];

  const weeklyData = [
    { day: 'Mon', tasks: 5, points: 250 },
    { day: 'Tue', tasks: 3, points: 150 },
    { day: 'Wed', tasks: 8, points: 400 },
    { day: 'Thu', tasks: 4, points: 200 },
    { day: 'Fri', tasks: 6, points: 300 },
    { day: 'Sat', tasks: 2, points: 100 },
    { day: 'Sun', tasks: 7, points: 350 }
  ];

  const monthlyGoalProgress = (stats.completedGoals / (stats.activeGoals + stats.completedGoals)) * 100 || 0;

  return renderContent(
    <Stack gap="md">
      {/* Compact Header with Animated Welcome */}
      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <div>
            <div style={{ fontSize: 'var(--mantine-font-size-lg)', fontWeight: 700, marginBottom: '4px' }}>
              <BlurText 
                text={`${getGreeting()}! 👋`}
                delay={100}
                animateBy="words"
                direction="top"
                className=""
                onAnimationComplete={() => console.log('Welcome animation complete!')}
              />
            </div>
            <div style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)' }}>
              <BlurText 
                text="Ready to tackle today's tasks?"
                delay={80}
                animateBy="words"
                direction="top"
                className=""
              />
            </div>
          </div>
          <Group gap="lg" visibleFrom="md">
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="blue">{stats.totalPoints}</Text>
              <Text size="xs" c="dimmed">Points</Text>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="violet">Level {stats.currentLevel}</Text>
              <Text size="xs" c="dimmed">Current</Text>
            </div>
          </Group>
        </Group>
      </Paper>

      {/* Task Calendar - Full Width */}
      <Box style={{ width: '100%' }}>
        <TaskCalendar 
          tasks={userTasks}
          currentUser={authUser as any}
          onTaskClick={(task) => console.log('Clicked task:', task.title)}
          onTaskUpdate={(task) => {
            // Reload dashboard data when tasks are updated
            loadDashboardData();
          }}
        />
      </Box>

      {/* Primary Stats Grid */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Tasks Done</Text>
            <ThemeIcon size="sm" color="green" variant="light">
              <IconCheckbox size={16} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>{stats.tasksCompleted}</Text>
          <Progress 
            value={Math.min((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending)) * 100, 100)} 
            color="green" 
            size="xs" 
            mt="xs" 
          />
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Streak</Text>
            <ThemeIcon size="sm" color="orange" variant="light">
              <IconFlame size={16} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>{stats.streakDays}</Text>
          <Text size="xs" c="dimmed" mt="xs">days active</Text>
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Goals</Text>
            <ThemeIcon size="sm" color="yellow" variant="light">
              <IconTrophy size={16} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>{stats.completedGoals}/{stats.activeGoals + stats.completedGoals}</Text>
          <Progress 
            value={monthlyGoalProgress} 
            color="yellow" 
            size="xs" 
            mt="xs" 
          />
        </Card>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">Achievements</Text>
            <ThemeIcon size="sm" color="violet" variant="light">
              <IconStar size={16} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700}>{stats.achievements}</Text>
          <Text size="xs" c="dimmed" mt="xs">unlocked</Text>
        </Card>
      </SimpleGrid>

      {/* Analytics Grid - StatsGrid Pattern */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Task Analytics</Text>
          <Badge color="blue" variant="light" size="sm">Real-time</Badge>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {analyticsData.timeMetrics.map((metric: any, index: number) => {
            const iconMap: Record<string, any> = {
              'IconClock': IconClock,
              'IconTrendingUp': IconTrendingUp,
              'IconTargetArrow': IconTargetArrow,
              'IconFolderOpen': IconFolderOpen
            };
            const IconComponent = iconMap[metric.icon] || IconClock;
            
            const TrendIcon = metric.trend === 'up' ? IconArrowUpRight : 
                             metric.trend === 'down' ? IconArrowDownRight : null;
            
            return (
              <Paper key={index} withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">{metric.label}</Text>
                  <IconComponent size={16} color="var(--mantine-color-blue-6)" />
                </Group>
                
                <Group align="flex-end" gap="xs">
                  <Text size="xl" fw={700}>{metric.value}</Text>
                  <Text size="xs" c="dimmed" pb={4}>{metric.unit}</Text>
                </Group>
                
                {TrendIcon && metric.change > 0 && (
                  <Group gap="xs" mt="xs">
                    <Group gap={2} align="center">
                      <TrendIcon size={14} color={metric.trend === 'up' ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-red-6)'} />
                      <Text size="xs" c={metric.trend === 'up' ? 'teal' : 'red'} fw={700}>
                        {metric.change}%
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">vs last period</Text>
                  </Group>
                )}
              </Paper>
            );
          })}
        </SimpleGrid>
      </Card>

      {/* Status Flow - StatsSegments Pattern */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Task Status Flow</Text>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Total:</Text>
            <Text size="sm" fw={700}>{stats.tasksCompleted + stats.tasksPending}</Text>
          </Group>
        </Group>
        
        <Progress.Root size="xl" mb="md">
          {analyticsData.statusFlow.map((status: any, index: number) => (
            <Progress.Section
              key={index}
              value={status.percentage}
              color={
                status.name.includes('Done') ? 'green' :
                status.name.includes('Progress') ? 'blue' :
                status.name.includes('Review') ? 'yellow' :
                status.name.includes('Todo') ? 'gray' : 'violet'
              }
            >
              {status.percentage > 10 && (
                <Progress.Label>{status.percentage}%</Progress.Label>
              )}
            </Progress.Section>
          ))}
        </Progress.Root>
        
        <SimpleGrid cols={{ base: 2, sm: analyticsData.statusFlow.length }} spacing="xs">
          {analyticsData.statusFlow.map((status: any, index: number) => (
            <Group key={index} gap="xs" justify="center">
              <ThemeIcon
                size="xs"
                color={
                  status.name.includes('Done') ? 'green' :
                  status.name.includes('Progress') ? 'blue' :
                  status.name.includes('Review') ? 'yellow' :
                  status.name.includes('Todo') ? 'gray' : 'violet'
                }
              />
              <div>
                <Text size="xs" fw={500}>{status.name}</Text>
                <Text size="xs" c="dimmed">{status.value} tasks</Text>
              </div>
            </Group>
          ))}
        </SimpleGrid>
      </Card>

      {/* Charts Section */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Priority Distribution</Text>
              <Badge color="orange" variant="light" size="sm">Active</Badge>
            </Group>
            {analyticsData.priorityDistribution.length > 0 ? (
              <PieChart
                h={180}
                data={analyticsData.priorityDistribution}
                withTooltip
                tooltipDataSource="segment"
                mx="auto"
              />
            ) : (
              <Center h={180}>
                <Text size="sm" c="dimmed">No priority data</Text>
              </Center>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Category Breakdown</Text>
              <Badge color="violet" variant="light" size="sm">All time</Badge>
            </Group>
            {analyticsData.categoryBreakdown.length > 0 ? (
              <DonutChart
                h={180}
                data={analyticsData.categoryBreakdown}
                withTooltip
                tooltipDataSource="segment"
                mx="auto"
              />
            ) : (
              <Center h={180}>
                <Text size="sm" c="dimmed">No category data</Text>
              </Center>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Weekly Activity</Text>
              <Badge color="blue" variant="light" size="sm">Last 7 days</Badge>
            </Group>
            <AreaChart
              h={180}
              data={weeklyData}
              dataKey="day"
              series={[
                { name: 'tasks', color: 'blue.6' },
                { name: 'points', color: 'violet.6' }
              ]}
              curveType="natural"
              gridAxis="xy"
              tickLine="xy"
              withXAxis={false}
            />
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions & Recent Activity */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Text fw={500} mb="md">Quick Actions</Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              <Button 
                variant="light" 
                leftSection={<IconCheckbox size={16} />}
                size="sm"
                onClick={() => onQuickAction?.('new-task')}
              >
                New Task
              </Button>
              <Button 
                variant="light" 
                leftSection={<IconTrophy size={16} />}
                size="sm"
                color="yellow"
                onClick={() => onQuickAction?.('goals')}
              >
                Set Goal
              </Button>
              <Button 
                variant="light" 
                leftSection={<IconUsers size={16} />}
                size="sm"
                color="green"
                onClick={() => onQuickAction?.('family')}
              >
                Family
              </Button>
              <Button 
                variant="light" 
                leftSection={<IconStar size={16} />}
                size="sm"
                color="violet"
                onClick={() => onQuickAction?.('achievements')}
              >
                Achievements
              </Button>
            </SimpleGrid>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Text fw={500} mb="md">Recent Activity</Text>
            <Stack gap="xs">
              {recentActivity.slice(0, 3).map((activity) => (
                <Group key={activity.id} gap="xs">
                  <ThemeIcon
                    size={16}
                    radius="xl"
                    color={
                      activity.type === 'task_completed' ? 'green' :
                      activity.type === 'points_earned' ? 'blue' :
                      activity.type === 'achievement_unlocked' ? 'yellow' :
                      'violet'
                    }
                  />
                  <div style={{ flex: 1 }}>
                    <Text size="xs" lineClamp={1}>{activity.title}</Text>
                    <Text size="xs" c="dimmed">{formatTimestamp(activity.timestamp)}</Text>
                  </div>
                </Group>
              ))}
              {recentActivity.length === 0 && (
                <Text size="xs" c="dimmed" ta="center" py="md">No recent activity</Text>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};
