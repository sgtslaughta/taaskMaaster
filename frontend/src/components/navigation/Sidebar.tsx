/**
 * @fileoverview Sidebar navigation component for the TaaskMaaster application
 * @description A collapsible sidebar with navigation items and user profile section
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { 
  HomeIcon,
  CheckCircleIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';

/**
 * @description Navigation item interface
 */
export interface NavigationItem {
  /**
   * @description Unique identifier for the navigation item
   */
  id: string;
  /**
   * @description Display name for the navigation item
   */
  name: string;
  /**
   * @description Icon component for the navigation item
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * @description URL path for the navigation item
   */
  href: string;
  /**
   * @description Whether the item is currently active
   */
  active?: boolean;
  /**
   * @description Badge count for notifications or counts
   */
  badge?: number;
  /**
   * @description Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * @description Sub-items for nested navigation
   */
  children?: NavigationItem[];
}

/**
 * @description Sidebar component props interface
 */
export interface SidebarProps {
  /**
   * @description Whether the sidebar is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the sidebar
   */
  onClose: () => void;
  /**
   * @description User data object
   */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: number;
  } | null;
  /**
   * @description Navigation items to display
   */
  navigationItems?: NavigationItem[];
  /**
   * @description Function to handle navigation item clicks
   */
  onNavigationClick?: (item: NavigationItem) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Default navigation items
 */
const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: HomeIcon,
    href: '/dashboard',
    active: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckCircleIcon,
    href: '/tasks',
    badge: 3,
  },
  {
    id: 'goals',
    name: 'Goals',
    icon: TrophyIcon,
    href: '/goals',
  },
  {
    id: 'family',
    name: 'Family',
    icon: UserGroupIcon,
    href: '/family',
  },
  {
    id: 'achievements',
    name: 'Achievements',
    icon: StarIcon,
    href: '/achievements',
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    icon: ChartBarIcon,
    href: '/leaderboard',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: CalendarIcon,
    href: '/calendar',
  },
  {
    id: 'streaks',
    name: 'Streaks',
    icon: FireIcon,
    href: '/streaks',
  },
  {
    id: 'learning',
    name: 'Learning',
    icon: AcademicCapIcon,
    href: '/learning',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Cog6ToothIcon,
    href: '/settings',
  },
];

/**
 * @description Sidebar component
 * @param props - Sidebar component props
 * @returns Sidebar component
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
  navigationItems = defaultNavigationItems,
  onNavigationClick,
  className,
}) => {
  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return;
    
    if (onNavigationClick) {
      onNavigationClick(item);
    }
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
          },
          className
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Close button for mobile */}
          <div className="flex items-center justify-end p-4 border-b border-gray-200">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={cn(
                      'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                      {
                        'bg-blue-100 text-blue-900': item.active,
                        'text-gray-600 hover:bg-gray-50 hover:text-gray-900': !item.active,
                        'opacity-50 cursor-not-allowed': item.disabled,
                        'cursor-pointer': !item.disabled,
                      }
                    )}
                  >
                    <Icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        {
                          'text-blue-500': item.active,
                          'text-gray-400 group-hover:text-gray-500': !item.active,
                        }
                      )}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                  
                  {/* Sub-items */}
                  {item.children && item.active && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleItemClick(child)}
                            disabled={child.disabled}
                            className={cn(
                              'group flex items-center w-full px-2 py-1 text-sm rounded-md transition-colors duration-150',
                              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                              {
                                'bg-blue-50 text-blue-700': child.active,
                                'text-gray-500 hover:bg-gray-50 hover:text-gray-700': !child.active,
                                'opacity-50 cursor-not-allowed': child.disabled,
                                'cursor-pointer': !child.disabled,
                              }
                            )}
                          >
                            <ChildIcon
                              className={cn(
                                'mr-2 h-4 w-4 flex-shrink-0',
                                {
                                  'text-blue-500': child.active,
                                  'text-gray-400 group-hover:text-gray-500': !child.active,
                                }
                              )}
                            />
                            <span className="flex-1 text-left">{child.name}</span>
                            {child.badge && (
                              <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {child.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>TaaskMaaster v1.0.0</p>
              <p className="mt-1">Family Task Management</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
