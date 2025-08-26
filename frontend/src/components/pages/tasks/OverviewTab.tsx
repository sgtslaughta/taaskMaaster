/**
 * @fileoverview Analytics Dashboard Overview Tab Component for TaaskMaaster
 * @description Analytics dashboard with metrics, charts, and performance insights
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Task as FrontendTask } from '../../tasks';
import { Card } from '../../../design-system/components/Card';
import { cn } from '../../../design-system/utils/cn';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline';

/**
 * @description Analytics dashboard component props
 */
export interface OverviewTabProps {
  /**
   * @description Tasks to analyze
   */
  tasks: FrontendTask[];
  /**
   * @description Loading state
   */
  loading: boolean;
  /**
   * @description Error state
   */
  error: string | null;
  /**
   * @description Function to refresh data
   */
  onRefresh: () => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description KPI Card component
 */
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, icon: Icon, color }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
          <div className="flex items-center mt-1">
            <ArrowTrendingUpIcon 
              className={cn(
                "w-3 h-3 mr-1",
                trend.isPositive ? "text-green-500" : "text-red-500"
              )} 
            />
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </Card>
);

/**
 * @description Analytics dashboard component
 * @param props - Analytics dashboard component props
 * @returns Analytics dashboard component
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  tasks,
  loading,
  error,
  onRefresh,
  className,
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  /**
   * @description Get task statistics
   */
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    return { total, completed, inProgress, overdue };
  };

  /**
   * @description Get completion rate
   */
  const getCompletionRate = () => {
    const stats = getTaskStats();
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  /**
   * @description Get average completion time
   */
  const getAverageCompletionTime = () => {
    const completedTasks = tasks.filter(t => t.status === 'done');
    if (completedTasks.length === 0) return 'N/A';
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    
    const avgDays = totalDays / completedTasks.length;
    return avgDays < 1 ? '< 1 day' : `${avgDays.toFixed(1)}d`;
  };

  /**
   * @description Get total points earned
   */
  const getTotalPoints = () => {
    return tasks.reduce((sum, task) => sum + (task.points || 0), 0);
  };

  /**
   * @description Get completion trends data
   */
  const getCompletionTrends = () => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.status === 'done');
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: completedTasks.length,
        total: dayTasks.length,
        rate: dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0
      });
    }
    
    return data;
  };

  /**
   * @description Get task distribution data
   */
  const getTaskDistribution = () => {
    const stats = getTaskStats();
    return [
      { name: 'Completed', value: stats.completed, color: '#10B981' },
      { name: 'In Progress', value: stats.inProgress, color: '#F59E0B' },
      { name: 'Overdue', value: stats.overdue, color: '#EF4444' },
      { name: 'Pending', value: stats.total - stats.completed - stats.inProgress - stats.overdue, color: '#6B7280' }
    ].filter(item => item.value > 0);
  };

  /**
   * @description Get category performance data
   */
  const getCategoryPerformance = () => {
    const categoryMap = new Map<string, { total: number; completed: number }>();
    
    tasks.forEach(task => {
      const category = task.category?.name || 'Uncategorized';
      const current = categoryMap.get(category) || { total: 0, completed: 0 };
      current.total += 1;
      if (task.status === 'done') current.completed += 1;
      categoryMap.set(category, current);
    });
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      total: data.total
    })).sort((a, b) => b.completionRate - a.completionRate);
  };

  /**
   * @description Get productivity heatmap data
   */
  const getProductivityHeatmap = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });
      
      const completedTasks = dayTasks.filter(task => task.status === 'done');
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: completedTasks.length,
        intensity: completedTasks.length > 0 ? Math.min(completedTasks.length * 20, 100) : 0
      });
    }
    
    return data;
  };

  /**
   * @description Get points tracking data
   */
  const getPointsTracking = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPoints = tasks
        .filter(task => {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          return taskDate === dateStr && task.status === 'done';
        })
        .reduce((sum, task) => sum + (task.points || 0), 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: dayPoints
      });
    }
    
    return data;
  };

  const stats = getTaskStats();
  const completionRate = getCompletionRate();
  const averageTime = getAverageCompletionTime();
  const totalPoints = getTotalPoints();

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex space-x-1">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-2 py-1 text-xs rounded-md",
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Tasks"
          value={stats.total}
          trend={{ value: 12, isPositive: true }}
          icon={ChartBarIcon}
          color="bg-blue-500"
        />
        <KPICard
          title="Completion Rate"
          value={`${completionRate}%`}
          trend={{ value: 5, isPositive: true }}
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <KPICard
          title="Avg. Time"
          value={averageTime}
          trend={{ value: 8, isPositive: false }}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
        <KPICard
          title="Points Earned"
          value={totalPoints}
          trend={{ value: 15, isPositive: true }}
          icon={StarIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion Trends */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Completion Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={getCompletionTrends()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
              <YAxis stroke="#9CA3AF" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  color: '#F9FAFB',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Completion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Task Distribution */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={getTaskDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {getTaskDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  color: '#F9FAFB',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Performance */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Category Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={getCategoryPerformance()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9CA3AF" fontSize={10} />
              <YAxis stroke="#9CA3AF" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  color: '#F9FAFB',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="completionRate" fill="#10B981" name="Completion Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Points Tracking */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Points & Rewards Tracking</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={getPointsTracking()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
              <YAxis stroke="#9CA3AF" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  color: '#F9FAFB',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="points" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                name="Points Earned"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Productivity Heatmap */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Productivity Heatmap (Last 30 Days)</h3>
        <div className="grid grid-cols-15 gap-0.5">
          {getProductivityHeatmap().map((day, index) => (
            <div
              key={index}
              className={cn(
                "h-6 rounded text-xs flex items-center justify-center text-white font-medium",
                day.intensity === 0 && "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
                day.intensity > 0 && day.intensity <= 20 && "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200",
                day.intensity > 20 && day.intensity <= 40 && "bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100",
                day.intensity > 40 && day.intensity <= 60 && "bg-green-400 dark:bg-green-600 text-white",
                day.intensity > 60 && day.intensity <= 80 && "bg-green-500 dark:bg-green-500 text-white",
                day.intensity > 80 && "bg-green-600 dark:bg-green-400 text-white"
              )}
              title={`${day.date}: ${day.completed} tasks completed`}
            >
              {day.completed > 0 ? day.completed : ''}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center mt-2 space-x-3 text-xs text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 20, 40, 60, 80, 100].map((intensity) => (
              <div
                key={intensity}
                className={cn(
                  "w-3 h-3 rounded",
                  intensity === 0 && "bg-gray-200 dark:bg-gray-700",
                  intensity > 0 && intensity <= 20 && "bg-green-200 dark:bg-green-800",
                  intensity > 20 && intensity <= 40 && "bg-green-300 dark:bg-green-700",
                  intensity > 40 && intensity <= 60 && "bg-green-400 dark:bg-green-600",
                  intensity > 60 && intensity <= 80 && "bg-green-500 dark:bg-green-500",
                  intensity > 80 && "bg-green-600 dark:bg-green-400"
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </Card>
    </div>
  );
};
