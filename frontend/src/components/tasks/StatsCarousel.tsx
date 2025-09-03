/**
 * @fileoverview Statistics Carousel Component for TaaskMaaster
 * @description Multi-item horizontal sliding carousel for task statistics
 * @author TaaskMaaster Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../design-system/utils/cn';
import {
  ListBulletIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  TrophyIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

/**
 * @description Statistics data interface
 */
export interface StatsData {
  /** Total number of tasks */
  total: number;
  /** Number of pending tasks */
  pending: number;
  /** Number of in-progress tasks */
  inProgress: number;
  /** Number of completed tasks */
  completed: number;
  /** Total points earned */
  totalPoints: number;
  /** Number of overdue tasks */
  overdue: number;
  /** Number of tasks due today */
  dueToday: number;
  /** Number of tasks due this week */
  dueThisWeek: number;
  /** Number of high/urgent priority tasks */
  highPriority: number;
  /** Latest completed task title */
  latestCompleted?: string;
  /** Completion rate percentage */
  completionRate: number;
}

/**
 * @description Statistics carousel component props
 */
export interface StatsCarouselProps {
  /** Statistics data */
  stats: StatsData;
  /** Whether to auto-rotate */
  autoRotate?: boolean;
  /** Rotation interval in milliseconds */
  rotationInterval?: number;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Number of items to show per slide */
  itemsPerSlide?: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  /** Whether to show dots indicator */
  showDots?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Individual statistic item
 */
interface StatItem {
  id: string;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  description?: string;
}

/**
 * @description Statistics Carousel Component
 */
const StatsCarousel: React.FC<StatsCarouselProps> = ({
  stats,
  autoRotate = true,
  rotationInterval = 4000,
  animationDuration = 500,
  itemsPerSlide = { desktop: 4, tablet: 3, mobile: 2 },
  showArrows = true,
  showDots = true,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(itemsPerSlide.desktop);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * @description Statistics items configuration
   */
  const statItems: StatItem[] = [
    {
      id: 'total',
      label: 'Total Tasks',
      value: stats.total,
      icon: ListBulletIcon,
      iconColor: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      description: 'All assigned tasks'
    },
    {
      id: 'pending',
      label: 'Pending',
      value: stats.pending,
      icon: ClockIcon,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'Tasks to start'
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      value: stats.inProgress,
      icon: PlayIcon,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Currently working on'
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Tasks finished'
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      icon: ExclamationTriangleIcon,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      description: 'Past due date'
    },
    {
      id: 'dueToday',
      label: 'Due Today',
      value: stats.dueToday,
      icon: CalendarIcon,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: 'Due by end of day'
    },
    {
      id: 'dueThisWeek',
      label: 'Due This Week',
      value: stats.dueThisWeek,
      icon: CalendarIcon,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      description: 'Due within 7 days'
    },
    {
      id: 'highPriority',
      label: 'High Priority',
      value: stats.highPriority,
      icon: FireIcon,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'Urgent & high priority'
    },
    {
      id: 'points',
      label: 'Points Earned',
      value: stats.totalPoints,
      icon: TrophyIcon,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      description: 'Total reward points'
    },
    {
      id: 'completionRate',
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: BoltIcon,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Tasks completed rate'
    },
    ...(stats.latestCompleted ? [{
      id: 'latest',
      label: 'Latest Completed',
      value: stats.latestCompleted.length > 20 ? `${stats.latestCompleted.substring(0, 20)}...` : stats.latestCompleted,
      icon: SparklesIcon,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      description: 'Most recently finished'
    }] : [])
  ];

  /**
   * @description Handle responsive breakpoints
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsToShow(itemsPerSlide.desktop);
      } else if (width >= 768) {
        setItemsToShow(itemsPerSlide.tablet);
      } else {
        setItemsToShow(itemsPerSlide.mobile);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerSlide]);

  /**
   * @description Calculate maximum slide position
   */
  const maxIndex = Math.max(0, statItems.length - itemsToShow);

  /**
   * @description Auto-rotation effect with continuous sliding
   */
  useEffect(() => {
    if (!autoRotate || isAnimating || statItems.length <= itemsToShow) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex > maxIndex ? 0 : nextIndex;
        });
        setTimeout(() => setIsAnimating(false), animationDuration / 2);
      }, animationDuration / 4);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, maxIndex, isAnimating, animationDuration, statItems.length, itemsToShow]);

  /**
   * @description Navigate to next slide with animation
   */
  const goToNext = () => {
    if (isAnimating || currentIndex >= maxIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
      setTimeout(() => setIsAnimating(false), animationDuration / 2);
    }, animationDuration / 4);
  };

  /**
   * @description Navigate to previous slide with animation
   */
  const goToPrevious = () => {
    if (isAnimating || currentIndex <= 0) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      setTimeout(() => setIsAnimating(false), animationDuration / 2);
    }, animationDuration / 4);
  };

  /**
   * @description Navigate to specific position with animation
   */
  const goToIndex = (index: number) => {
    if (isAnimating || index === currentIndex || index < 0 || index > maxIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), animationDuration / 2);
    }, animationDuration / 4);
  };

  /**
   * @description Calculate transform offset for continuous sliding
   */
  const getTransformOffset = () => {
    const itemWidth = 100 / statItems.length;
    return -(currentIndex * itemWidth);
  };

  /**
   * @description Calculate total dot indicators needed
   */
  const totalDots = Math.max(1, maxIndex + 1);

  return (
    <div className={cn('bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4', className)}>
      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        {showArrows && statItems.length > itemsToShow && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              disabled={isAnimating || currentIndex === 0}
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-200',
                isAnimating || currentIndex === 0
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-110'
              )}
              aria-label="Previous statistics"
            >
              <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              disabled={isAnimating || currentIndex >= maxIndex}
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 transition-all duration-200',
                isAnimating || currentIndex >= maxIndex
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-110'
              )}
              aria-label="Next statistics"
            >
              <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </>
        )}

        {/* Carousel Track */}
        <div className="overflow-hidden mx-8" ref={containerRef}>
          <div 
            className={cn(
              'flex transition-transform duration-500 ease-in-out',
            )}
            style={{
              transform: `translateX(${getTransformOffset()}%)`,
              width: `${statItems.length * (100 / itemsToShow)}%`,
            }}
          >
            {statItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex-shrink-0 px-2',
                  )}
                  style={{ width: `${100 / statItems.length}%` }}
                >
                  <div className={cn(
                    'bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 h-full border border-gray-100 dark:border-gray-700 transition-all duration-300',
                    'hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600',
                    isAnimating ? 'opacity-80' : 'opacity-100'
                  )}>
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto',
                      item.bgColor
                    )}>
                      <IconComponent className={cn('w-6 h-6', item.iconColor)} />
                    </div>
                    
                    {/* Content */}
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {item.label}
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {item.value}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {showDots && statItems.length > itemsToShow && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalDots }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              disabled={isAnimating}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === currentIndex
                  ? 'bg-blue-500 w-6' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500',
                isAnimating && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={`Go to position ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatsCarousel;
