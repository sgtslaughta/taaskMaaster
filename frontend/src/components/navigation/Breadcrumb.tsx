/**
 * @fileoverview Breadcrumb navigation component for the TaaskMaaster application
 * @description A breadcrumb component that shows page hierarchy and navigation
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';

/**
 * @description Breadcrumb item interface
 */
export interface BreadcrumbItem {
  /**
   * @description Unique identifier for the breadcrumb item
   */
  id: string;
  /**
   * @description Display name for the breadcrumb item
   */
  label: string;
  /**
   * @description URL path for the breadcrumb item
   */
  href?: string;
  /**
   * @description Whether this is the current page
   */
  current?: boolean;
  /**
   * @description Icon component for the breadcrumb item
   */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * @description Breadcrumb component props interface
 */
export interface BreadcrumbProps {
  /**
   * @description Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * @description Function to handle breadcrumb item clicks
   */
  onItemClick?: (item: BreadcrumbItem) => void;
  /**
   * @description Whether to show the home icon for the first item
   */
  showHomeIcon?: boolean;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Breadcrumb component
 * @param props - Breadcrumb component props
 * @returns Breadcrumb component
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onItemClick,
  showHomeIcon = true,
  className,
}) => {
  const handleItemClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
    event.preventDefault();
    
    if (item.current || !item.href) return;
    
    if (onItemClick) {
      onItemClick(item);
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const Icon = item.icon;
          
          return (
            <li key={item.id} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
              
              {/* Breadcrumb item */}
              <div className="flex items-center">
                {index === 0 && showHomeIcon && !Icon ? (
                  <HomeIcon className="h-4 w-4 text-gray-400 mr-1" />
                ) : Icon ? (
                  <Icon className="h-4 w-4 text-gray-400 mr-1" />
                ) : null}
                
                {item.current ? (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      'text-gray-500 cursor-default'
                    )}
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    onClick={(e) => handleItemClick(item, e)}
                    className={cn(
                      'text-sm font-medium',
                      'text-gray-500 hover:text-gray-700',
                      'transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      'rounded px-1 py-0.5'
                    )}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * @description Utility function to generate breadcrumb items from a path
 * @param path - URL path to convert to breadcrumb items
 * @param currentPage - Current page name
 * @returns Array of breadcrumb items
 */
export const generateBreadcrumbsFromPath = (
  path: string,
  currentPage?: string
): BreadcrumbItem[] => {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
    },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    items.push({
      id: segment,
      label: isLast && currentPage ? currentPage : segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });

  return items;
};

/**
 * @description Utility function to generate breadcrumb items for common pages
 * @param page - Page identifier
 * @param subPage - Sub-page identifier
 * @returns Array of breadcrumb items
 */
export const getCommonBreadcrumbs = (
  page: string,
  subPage?: string
): BreadcrumbItem[] => {
  const baseItems: BreadcrumbItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
    },
  ];

  const pageMap: Record<string, { label: string; href: string; icon?: React.ComponentType<{ className?: string }> }> = {
    dashboard: { label: 'Dashboard', href: '/dashboard' },
    tasks: { label: 'Tasks', href: '/tasks' },
    goals: { label: 'Goals', href: '/goals' },
    family: { label: 'Family', href: '/family' },
    achievements: { label: 'Achievements', href: '/achievements' },
    leaderboard: { label: 'Leaderboard', href: '/leaderboard' },
    calendar: { label: 'Calendar', href: '/calendar' },
    streaks: { label: 'Streaks', href: '/streaks' },
    learning: { label: 'Learning', href: '/learning' },
    settings: { label: 'Settings', href: '/settings' },
    profile: { label: 'Profile', href: '/profile' },
  };

  const pageInfo = pageMap[page];
  if (pageInfo) {
    baseItems.push({
      id: page,
      label: pageInfo.label,
      href: subPage ? pageInfo.href : undefined,
      current: !subPage,
      icon: pageInfo.icon,
    });

    if (subPage) {
      baseItems.push({
        id: subPage,
        label: subPage.charAt(0).toUpperCase() + subPage.slice(1),
        current: true,
      });
    }
  }

  return baseItems;
};
