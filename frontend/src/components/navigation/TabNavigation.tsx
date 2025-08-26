/**
 * @fileoverview Tab Navigation Component for TaaskMaaster
 * @description Floating right-side tab navigation for the Tasks page with hover expansion
 * @author TaaskMaaster Team
 * @version 3.0.0
 */

import React from 'react';
import { 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  ListBulletIcon, 
  SwatchIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { cn } from '../../design-system/utils/cn';

/**
 * @description Tab item interface
 */
export interface TabItem {
  /**
   * @description Unique identifier for the tab
   */
  id: string;
  /**
   * @description Display label for the tab
   */
  label: string;
  /**
   * @description Heroicon component for the tab
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * @description Whether the tab is disabled
   */
  disabled?: boolean;
  /**
   * @description Badge count to display on the tab
   */
  badge?: number;
}

/**
 * @description Tab navigation component props
 */
export interface TabNavigationProps {
  /**
   * @description Available tabs
   */
  tabs: TabItem[];
  /**
   * @description Currently active tab
   */
  activeTab: string;
  /**
   * @description Function to handle tab changes
   */
  onTabChange: (tabId: string) => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Tab navigation component
 * @param props - Tab navigation component props
 * @returns Tab navigation component
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn(
      'fixed right-4 top-1/2 transform -translate-y-1/2 z-40',
      'group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
      'transition-all duration-300 ease-in-out',
      'w-12 hover:w-64',
      className
    )}>
      <div className="flex flex-col">
        {/* Hamburger Menu Icon - Only visible when collapsed */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 opacity-100 group-hover:opacity-0 transition-opacity duration-300 h-auto group-hover:h-0 overflow-hidden">
          <div className="flex items-center justify-center">
            <Bars3Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Header - Only visible on hover */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-0 group-hover:h-auto overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Task Views</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Switch between different task views</p>
        </div>
        
        {/* Tab Navigation */}
        <nav className="p-2 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'w-full flex items-center px-2 py-2 text-sm font-medium rounded-md min-h-[40px]',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                'justify-center group-hover:justify-start',
                'group-hover:pl-2'
              )}
              title={tab.label}
            >
              <tab.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                activeTab === tab.id
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500',
                'ml-2 group-hover:mr-3'
              )} />
              <span className="flex-1 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ml-3 w-0 group-hover:w-auto overflow-hidden">
                {tab.label}
              </span>
              {tab.badge && tab.badge > 0 && (
                <span className={cn(
                  'ml-3 px-2 py-0.5 text-xs font-medium rounded-full',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                  activeTab === tab.id
                    ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                )}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
