/**
 * @fileoverview Sidebar navigation component for the TaaskMaaster application
 * @description A collapsible sidebar with navigation items and user profile section
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';

/**
 * @description Navigation item interface
 */
export interface NavigationItem {
  /** Unique identifier for the navigation item */
  id: string;
  /** Display name for the navigation item */
  name: string;
  /** Icon component for the navigation item */
  icon?: React.ComponentType<{ className?: string }>;
  /** URL or route for the navigation item */
  href?: string;
  /** Whether the item is currently active */
  active?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Optional badge or notification count */
  badge?: string | number;
  /** Optional sub-items for dropdown menus */
  children?: NavigationItem[];
}

/**
 * @description Sidebar component props interface
 */
export interface SidebarProps {
  /** User information */
  user?: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: number;
  } | null;
  /** Navigation items */
  navigationItems?: NavigationItem[];
  /** Function called when a navigation item is clicked */
  onNavigation?: (item: NavigationItem) => void;
  /** Whether the sidebar is open (mobile) */
  open?: boolean;
  /** Whether the sidebar is collapsed (desktop) */
  collapsed?: boolean;
  /** Function called when the sidebar should be closed (mobile) */
  onClose?: () => void;
  /** Function called when the sidebar should be collapsed/expanded (desktop) */
  onToggleCollapse?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * @description Sidebar component
 * 
 * A responsive sidebar component that provides:
 * - Navigation menu with icons and labels
 * - User profile information
 * - Mobile-responsive design with overlay
 * - Collapsible functionality on desktop
 * - Dark mode support
 */
export const Sidebar: React.FC<SidebarProps> = ({
  user,
  navigationItems = [],
  onNavigation,
  open = false,
  collapsed = false,
  onClose,
  onToggleCollapse,
  className,
}) => {
  return (
    <>
      {/* Desktop sidebar - Fixed position, collapsible */}
      <div className={cn(
        'hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:left-0 lg:bottom-0 lg:z-40',
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        className
      )}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Collapse toggle button */}
          <div className="flex items-center justify-end p-2 pt-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'transition-transform duration-200',
                collapsed && 'rotate-180'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigation?.(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  item.active
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.name : undefined}
              >
                {item.icon && (
                  <item.icon className={cn(
                    'h-5 w-5',
                    item.active
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500',
                    !collapsed && 'mr-3'
                  )} />
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className={cn(
                        'ml-3 px-2 py-0.5 text-xs font-medium rounded-full',
                        item.active
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar - Overlay */}
      <div className={cn(
        'lg:hidden fixed inset-0 z-50',
        open ? 'block' : 'hidden'
      )}>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Sidebar */}
        <div className={cn(
          'fixed top-16 left-0 w-64 h-full bg-white dark:bg-gray-800',
          'border-r border-gray-200 dark:border-gray-700',
          'transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Close button for mobile */}
            <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className={cn(
                  'p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100',
                  'dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigation?.(item)}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    item.active
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon && (
                    <item.icon className={cn(
                      'mr-3 h-5 w-5',
                      item.active
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    )} />
                  )}
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <span className={cn(
                      'ml-3 px-2 py-0.5 text-xs font-medium rounded-full',
                      item.active
                        ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
