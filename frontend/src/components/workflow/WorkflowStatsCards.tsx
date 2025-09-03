/**
 * @fileoverview Workflow Statistics Cards Component
 * @description Dashboard cards displaying workflow metrics and statistics
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { Card, Grid, Group, Text, ThemeIcon } from '@mantine/core';
import { WorkflowStats } from '../../services/workflowStatsService';
// Fallback icons when @tabler/icons-react is not available
const IconClock = () => <div>⏰</div>;
const IconUser = () => <div>👤</div>;
const IconPlay = () => <div>▶️</div>;
const IconSend = () => <div>📤</div>;
const IconEye = () => <div>👁️</div>;
const IconCircleCheck = () => <div>✅</div>;
const IconAlertTriangle = () => <div>⚠️</div>;
const IconChartBar = () => <div>📊</div>;
const IconTrendingUp = () => <div>📈</div>;
const IconTrendingDown = () => <div>📉</div>;

interface WorkflowStatsCardsProps {
  stats: WorkflowStats;
  loading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  className?: string;
}

/**
 * @description Individual stat card component
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
  className
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />;
      case 'down':
        return <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'dimmed';
    
    switch (trend.direction) {
      case 'up':
        return 'green';
      case 'down':
        return 'red';
      default:
        return 'dimmed';
    }
  };

  return (
    <Card withBorder padding="md" className={className}>
      <Group justify="space-between" align="flex-start">
        <Group align="flex-start" gap="sm">
          <ThemeIcon size="lg" color={color} variant="light">
            <Icon size={20} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={500} c="dimmed">
              {title}
            </Text>
            <Text size="xl" fw={700} mt={4}>
              {value}
            </Text>
            {description && (
              <Text size="xs" c="dimmed" mt={2}>
                {description}
              </Text>
            )}
          </div>
        </Group>
        
        {trend && (
          <Group gap={4} align="center">
            {getTrendIcon()}
            <Text size="sm" fw={500} c={getTrendColor()}>
              {Math.abs(trend.value)}%
            </Text>
          </Group>
        )}
      </Group>
    </Card>
  );
};

/**
 * @description Workflow Statistics Cards Component
 */
export const WorkflowStatsCards: React.FC<WorkflowStatsCardsProps> = ({
  stats,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Grid className={className}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
            <Card withBorder padding="md">
              <Group align="flex-start" gap="sm">
                <ThemeIcon size="lg" variant="light">
                  <div style={{ width: 20, height: 20, backgroundColor: 'var(--mantine-color-gray-4)' }} />
                </ThemeIcon>
                <div>
                  <div style={{ width: 60, height: 14, backgroundColor: 'var(--mantine-color-gray-3)', borderRadius: 4 }} />
                  <div style={{ width: 40, height: 20, backgroundColor: 'var(--mantine-color-gray-3)', borderRadius: 4, marginTop: 8 }} />
                </div>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  }

  const statCards = [
    {
      title: 'Active Workflow',
      value: stats.activeWorkflow,
      icon: IconPlay,
      color: 'blue',
      description: 'Tasks in progress'
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: IconSend,
      color: 'violet',
      description: 'Awaiting review'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: IconCircleCheck,
      color: 'green',
      description: 'Tasks completed'
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: IconAlertTriangle,
      color: 'red',
      description: 'Past due date'
    },
    {
      title: 'Assigned',
      value: stats.assigned,
      icon: IconUser,
      color: 'cyan',
      description: 'Ready to start'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: IconClock,
      color: 'yellow',
      description: 'Currently working'
    },
    {
      title: 'In Review',
      value: stats.review,
      icon: IconEye,
      color: 'orange',
      description: 'Under review'
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: IconChartBar,
      color: 'gray',
      description: 'All tasks'
    }
  ];

  return (
    <div className={className}>
      {/* Main Workflow Metrics */}
      <div>
        <Text size="lg" fw={600} mb="md">
          Workflow Overview
        </Text>
        <Grid>
          {statCards.slice(0, 4).map((card, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                description={card.description}
              />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      {/* Status Distribution */}
      <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
        <Text size="lg" fw={600} mb="md">
          Status Distribution
        </Text>
        <Grid>
          {statCards.slice(4).map((card, index) => (
            <Grid.Col key={index + 4} span={{ base: 12, sm: 6, lg: 3 }}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                description={card.description}
              />
            </Grid.Col>
          ))}
        </Grid>
      </div>

      {/* Additional Metrics */}
      {(stats.dueTodayTasks > 0 || stats.dueThisWeekTasks > 0 || stats.highPriorityInWorkflow > 0) && (
        <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
          <Text size="lg" fw={600} mb="md">
            Priority Metrics
          </Text>
          <Grid>
            {stats.dueTodayTasks > 0 && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <StatCard
                  title="Due Today"
                  value={stats.dueTodayTasks}
                  icon={IconClock}
                  color="yellow"
                  description="Tasks due today"
                />
              </Grid.Col>
            )}
            {stats.dueThisWeekTasks > 0 && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <StatCard
                  title="Due This Week"
                  value={stats.dueThisWeekTasks}
                  icon={IconClock}
                  color="yellow"
                  description="Tasks due this week"
                />
              </Grid.Col>
            )}
            {stats.highPriorityInWorkflow > 0 && (
              <Grid.Col span={{ base: 12, md: 4 }}>
                <StatCard
                  title="High Priority"
                  value={stats.highPriorityInWorkflow}
                  icon={IconAlertTriangle}
                  color="orange"
                  description="High priority in workflow"
                />
              </Grid.Col>
            )}
          </Grid>
        </div>
      )}

      {/* Performance Metrics */}
      <div style={{ marginTop: 'var(--mantine-spacing-xl)' }}>
        <Text size="lg" fw={600} mb="md">
          Performance Metrics
        </Text>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder padding="md">
              <Group align="flex-start" gap="sm">
                <ThemeIcon size="lg" color="indigo" variant="light">
                  <IconChartBar size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500} c="dimmed">
                    Avg. Completion Time
                  </Text>
                  <Text size="xl" fw={700} mt={4}>
                    {stats.averageTimeToComplete}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    From creation to done
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder padding="md">
              <Group align="flex-start" gap="sm">
                <ThemeIcon size="lg" color="violet" variant="light">
                  <IconEye size={20} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={500} c="dimmed">
                    Approval Backlog
                  </Text>
                  <Text size="xl" fw={700} mt={4}>
                    {stats.approvalBacklog}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    Tasks awaiting approval
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
};

export default WorkflowStatsCards;
