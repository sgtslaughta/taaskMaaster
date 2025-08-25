/**
 * @fileoverview Main application layout component for TaaskMaaster
 * @description Combines header, sidebar, and content area with responsive behavior
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from '../navigation/Header';
import { Sidebar } from '../navigation/Sidebar';
import { cn } from '../../design-system/utils/cn';
import { useTheme } from '../../contexts/ThemeContext';
import { getSidebarState, saveSidebarState } from '../../utils/cookies';

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
 * @description App layout component props interface
 */
export interface AppLayoutProps {
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
  /** Page title */
  title?: string;
  /** Navigation items for the sidebar */
  navigationItems?: NavigationItem[];
  /** Function called when a navigation item is clicked */
  onNavigation?: (item: NavigationItem) => void;
  /** Function called when logout is requested */
  onLogout?: () => void;
  /** Whether to show the search functionality */
  showSearch?: boolean;
  /** Function called when search is performed */
  onSearch?: (query: string) => void;
  /** Whether to show notifications */
  showNotifications?: boolean;
  /** Function called when notifications are toggled */
  onNotificationsToggle?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Child components */
  children: React.ReactNode;
}

/**
 * @description App layout component
 * 
 * A comprehensive layout component that provides:
 * - Responsive header with navigation and user menu
 * - Collapsible sidebar navigation
 * - Main content area
 * - Dark mode support
 * - Mobile-responsive design
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  title,
  navigationItems = [],
  onNavigation,
  onLogout,
  showSearch = true,
  onSearch,
  showNotifications = false,
  onNotificationsToggle,
  className,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isDarkMode } = useTheme();

  /**
   * @description Initialize sidebar state from cookies
   */
  useEffect(() => {
    try {
      const savedSidebarState = getSidebarState();
      setSidebarCollapsed(savedSidebarState);
      console.log('Sidebar state initialized:', savedSidebarState ? 'collapsed' : 'expanded');
    } catch (error) {
      console.error('Failed to initialize sidebar state:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  /**
   * @description Handle sidebar toggle
   */
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * @description Handle sidebar collapse/expand
   */
  const handleSidebarCollapse = () => {
    const newCollapsedState = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsedState);
    
    // Save to cookies
    try {
      saveSidebarState(newCollapsedState);
      console.log('Sidebar state saved:', newCollapsedState ? 'collapsed' : 'expanded');
    } catch (error) {
      console.error('Failed to save sidebar state:', error);
    }
  };

  /**
   * @description Handle navigation item click
   */
  const handleNavigation = (item: NavigationItem) => {
    // Close sidebar on mobile when navigation item is clicked
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    if (onNavigation) {
      onNavigation(item);
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 dark:bg-gray-900',
      className
    )}>
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          user={user}
          onLogout={onLogout}
          showSearch={showSearch}
          onSearch={onSearch}
          showNotifications={showNotifications}
          onNotificationsToggle={onNotificationsToggle}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={handleSidebarToggle}
        />
      </div>

      {/* Main content area with header offset */}
      <div className="flex pt-16"> {/* pt-16 accounts for fixed header height */}
        {/* Sidebar - Collapsible on desktop, overlay on mobile */}
        <Sidebar
          user={user}
          navigationItems={navigationItems}
          onNavigation={handleNavigation}
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={handleSidebarCollapse}
        />

        {/* Main content */}
        <main className={cn(
          'flex-1 p-6 transition-all duration-200',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64' // Adjust margin based on sidebar state
        )}>
          {/* Page title */}
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}

          {/* Page content */}
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
